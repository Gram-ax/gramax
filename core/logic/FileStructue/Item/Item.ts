import { ItemStatus } from "@ext/Watchers/model/ItemStatus";
import IPermission from "../../../extensions/security/logic/Permission/IPermission";
import Permission from "../../../extensions/security/logic/Permission/Permission";
import Path from "../../FileProvider/Path/Path";
import { ArticleProps } from "../../SitePresenter/SitePresenter";
import { Category } from "../Category/Category";

export abstract class Item {
	private _neededPermission: IPermission = null;
	protected _watcherFuncs: WatcherFunc[] = [];

	constructor(
		protected _ref: ItemRef,
		protected _parent: Category,
		protected _props: { [code: string]: any } = {},
		protected _logicPath: string,
	) {
		this._neededPermission = new Permission(this._props["private"]);
	}

	getProp<T>(propName: string): T {
		return this._props[propName] ?? null;
	}

	get logicPath(): string {
		return this._logicPath;
	}
	set logicPath(value: string) {
		this._logicPath = value;
	}
	get ref(): ItemRef {
		return this._ref;
	}
	get parent(): Category {
		return this._parent;
	}
	set parent(value: Category) {
		this._parent = value;
	}
	get props() {
		return this._props;
	}
	get neededPermission(): IPermission {
		return this._neededPermission;
	}

	watch(w: WatcherFunc): void {
		this._watcherFuncs.push(w);
	}

	async setOrder(order: number) {
		if (this._props[ItemProps.order] == order) return;
		this._props[ItemProps.order] = order;
		await this._save();
	}

	async setLastPosition() {
		const items = this.parent.items;
		if (items.length == 0) this.props[ItemProps.order] = 0;
		else this.props[ItemProps.order] = +items[items.length - 1].props[ItemProps.order] + 1;
		await this._save();
	}

	async setNeededPermission(permission: IPermission) {
		this._neededPermission = permission;
		this._props["private"] = this._neededPermission.getValues();
		await this._save();
	}

	abstract get type(): ItemType;

	abstract updateProps(props: ArticleProps, rootCategoryProps?: any): Promise<Item>;

	abstract getFileName(): string;

	protected abstract _save(): Promise<void>;
}

type WatcherFunc = (changes: ItemStatus[]) => void;

enum ItemProps {
	order = "order",
}

export interface ItemRef {
	storageId: string;
	path: Path;
}

export enum ItemType {
	article = "article",
	category = "category",
}
