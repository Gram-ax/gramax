import CategoryFileStructure from "@core/FileStructue/Category/CategoryFileStructure";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import Path from "../../FileProvider/Path/Path";
import { ArticleProps } from "../../SitePresenter/SitePresenter";
import { Article, ArticleInitProps } from "../Article/Article";
import { FSProps } from "../FileStructure";
import { Item, ItemRef, ItemType } from "../Item/Item";

export type CategoryInitProps = ArticleInitProps<CategoryFileStructure> & {
	directory: Path;
	items: Item[];
	content?: string;
};

export class Category extends Article<CategoryFileStructure> {
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

	getItems(...filters: ((item: Item) => boolean)[]): Item[] {
		let items = [...this._items];
		filters?.forEach((filter) => (items = items.filter(filter)));
		return items;
	}

	getCategoryPathRef(): ItemRef {
		return {
			path: new Path(this._logicPath),
			storageId: this._ref.storageId,
		};
	}

	override getFileName(): string {
		return this._ref.path.parentDirectoryPath.name;
	}

	override async updateProps(props: ArticleProps, _: ResourceUpdater, rootCategoryProps?: FSProps) {
		await this._updateProps(props);
		await this._updateFolderName(props.fileName, rootCategoryProps);
		return this;
	}

	private async _updateFolderName(fileName: string, rootCategoryProps?: FSProps) {
		if (this.getFileName() == fileName) return;
		const path = this._ref.path.parentDirectoryPath.getNewName(fileName);
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
		return this._props[CategoryProps.orderAsc] ?? true;
	}
}

enum CategoryProps {
	title = "title",
	orderAsc = "orderAsc",
}
