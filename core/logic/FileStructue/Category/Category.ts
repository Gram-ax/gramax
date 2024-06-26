import ResourceUpdater from "@core/Resource/ResourceUpdater";
import createNewFilePathUtils from "@core/utils/createNewFilePathUtils";
import Path from "../../FileProvider/Path/Path";
import { ClientArticleProps } from "../../SitePresenter/SitePresenter";
import { Article, ArticleInitProps, type ArticleProps } from "../Article/Article";
import { FSProps } from "../FileStructure";
import { Item } from "../Item/Item";
import { ItemRef } from "../Item/ItemRef";
import { ItemType } from "../Item/ItemType";

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

	async sortItems(items?: Item[]) {
		const isAsc = this._isAscOrder();
		if (items) {
			let order = isAsc ? 1 : items.length;
			for (const item of items) {
				if (item) await item.setOrder(order);
				if (isAsc) order++;
				else order--;
			}
		}
		this._items.sort((x, y) => ((x.props.order ?? 0) - (y.props.order ?? 0)) * (isAsc ? 1 : -1));
	}

	// Нигде не используется
	// getItems(...filters: ((item: Item) => boolean)[]): Item[] {
	// 	let items = [...this._items];
	// 	filters?.forEach((filter) => (items = items.filter(filter)));
	// 	return items;
	// }

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
