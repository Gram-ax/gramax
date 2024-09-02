import { type Event, type EventEmitter } from "@core/Event/EventEmitter";
import { Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { digitsAfterDot } from "@core/FileStructue/Item/ItemOrderUtils";
import createNewFilePathUtils from "@core/utils/createNewFilePathUtils";
import Path from "../../FileProvider/Path/Path";
import { Article, ArticleInitProps, type ArticleEvents, type ArticleProps } from "../Article/Article";
import { FSProps } from "../FileStructure";
import { Item, ORDERING_MAX_PRECISION, type ItemEvents } from "../Item/Item";
import { ItemRef } from "../Item/ItemRef";
import { ItemType } from "../Item/ItemType";

export type CategoryEvents = ItemEvents &
	Event<"before-sort", { category: Category; force: boolean; asc: boolean }> &
	Event<"sorted", { category: Category; force: boolean; asc: boolean }>;

export type CategoryInitProps = ArticleInitProps<CategoryProps> & {
	directory: Path;
	items: Item[];
	content?: string;
}
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

	get events() {
		return super.events as EventEmitter<CategoryEvents> & EventEmitter<ArticleEvents>;
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

		await this.events.emit("before-sort", { category: this, force: !!force, asc: isAsc });

		if (force || this.items.some((i) => digitsAfterDot(i.order) > ORDERING_MAX_PRECISION)) {
			let order = isAsc ? 1 : this.items.length;
			for (const item of this.items) {
				if (item) await item.setOrder(order);
				if (isAsc) order++;
				else order--;
			}
		}

		this._items.sort((x, y) => ((x.props.order ?? 0) - (y.props.order ?? 0)) * (isAsc ? 1 : -1));
		await this.events.emit("sorted", { category: this, force: !!force, asc: isAsc });
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

	protected override async _updateFilename(fileName: string, rootCategoryProps?: FSProps) {
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
		this._logicPath = newCategory.logicPath;
		this._ref = newCategory._ref;
		this._directory = newCategory._directory;
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
