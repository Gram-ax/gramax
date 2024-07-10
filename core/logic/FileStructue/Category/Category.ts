import { digitsAfterDot } from "@core/FileStructue/Item/ItemOrderUtils";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import createNewFilePathUtils from "@core/utils/createNewFilePathUtils";
import Path from "../../FileProvider/Path/Path";
import { ClientArticleProps } from "../../SitePresenter/SitePresenter";
import { Article, ArticleInitProps, type ArticleProps } from "../Article/Article";
import { FSProps } from "../FileStructure";
import { Item, ORDERING_MAX_PRECISION } from "../Item/Item";
import { ItemRef } from "../Item/ItemRef";
import { ItemType } from "../Item/ItemType";
import { Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";

export type CategoryInitProps = ArticleInitProps<CategoryProps> & {
	directory: Path;
	items: Item[];
	content?: string;
};

export type CategoryProps = {
	orderAsc?: boolean;
	refs?: string[];
} & ArticleProps;

export class Category extends Article<CategoryProps> {
	private _items: Item[];
	private _directory: Path;

	constructor({ items, directory, ...init }: CategoryInitProps) {
		super(init);
		this._items = items;
		this._directory = directory;
	}

	get items() {
		return this._items;
	}

	get folderPath(): Path {
		return this._directory;
	}

	override get type() {
		return ItemType.category;
	}

	async sortItems(force?: boolean) {
		const isAsc = this._isAscOrder();

		if (force || this.items.some((i) => digitsAfterDot(i.order) > ORDERING_MAX_PRECISION)) {
			let order = isAsc ? 1 : this.items.length;
			for (const item of this.items) {
				if (item) await item.setOrder(order);
				if (isAsc) order++;
				else order--;
			}
		}

		this._items.sort((x, y) => ((x.props.order ?? 0) - (y.props.order ?? 0)) * (isAsc ? 1 : -1));
	}

	getFilteredItems(filters: ItemFilter[], catalog: Catalog): Item[] {
		return (
			filters?.reduce((items, filter) => items.filter((item) => filter(item, catalog)), [...this._items]) || []
		);
	}

	getCategoryPathRef(): ItemRef {
		return {
			path: new Path(this._logicPath),
			storageId: this._ref.storageId,
		};
	}

	override getFileName(): string {
		return this._ref.path.parentDirectoryPath.nameWithExtension;
	}

	override async updateProps(props: ClientArticleProps, _: ResourceUpdater, rootCategoryProps?: FSProps) {
		await this._updateProps(props);
		await this._updateFolderName(props.fileName, rootCategoryProps);
		return this;
	}

	private async _updateFolderName(fileName: string, rootCategoryProps?: FSProps) {
		if (this.getFileName() == fileName) return;
		let path = this._ref.path.parentDirectoryPath.parentDirectoryPath.join(new Path(fileName));
		if (await this._fs.fp.exists(path)) {
			const parent = this.ref.path.parentDirectoryPath;
			const readdir = await this._fs.fp.getItems(parent);
			path = createNewFilePathUtils.create(
				parent,
				readdir.map((s) => s.path),
				fileName,
			);
		}
		await this._fs.moveCategory(this, path);
		const newCategory = await this._updateCategory(rootCategoryProps, path);
		Object.assign(this, newCategory);
		return this;
	}

	private _updateCategory(rootCategoryProps: FSProps, folderPath: Path) {
		this.parsedContent = null;
		return this._fs.makeCategory(
			folderPath,
			this.parent,
			rootCategoryProps,
			{},
			folderPath.join(new Path(this.ref.path.nameWithExtension)),
		);
	}

	private _isAscOrder(): boolean {
		return this._props.orderAsc ?? true;
	}
}
