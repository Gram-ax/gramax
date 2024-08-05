import { roundedOrderAfter } from "@core/FileStructue/Item/ItemOrderUtils";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import { ItemStatus } from "@ext/Watchers/model/ItemStatus";
import type { FSLocalizationProps } from "@ext/localization/core/rules/FSLocalizationRules";
import t from "@ext/localization/locale/translate";
import IPermission from "../../../extensions/security/logic/Permission/IPermission";
import Permission from "../../../extensions/security/logic/Permission/Permission";
import { ClientArticleProps } from "../../SitePresenter/SitePresenter";
import { Category } from "../Category/Category";

export type ItemProps = FSLocalizationProps & {
	title?: string;
	description?: string;
	tags?: string[];
	order?: number;

	logicPath?: string;

	hidden?: boolean;
	private?: string[];
};

export const ORDERING_MAX_PRECISION = 6;

export abstract class Item<P extends ItemProps = ItemProps> {
	private _neededPermission: IPermission = null;
	protected _watcherFuncs: WatcherFunc[] = [];

	constructor(
		protected _ref: ItemRef,
		protected _parent: Category,
		protected _props: P,
		protected _logicPath: string,
	) {
		this._neededPermission = new Permission(this._props.private);
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
	get order(): number {
		return this._props.order ?? 0;
	}

	getTitle(): string {
		return this.props.title?.length ? this.props.title : t("article.no-name");
	}

	watch(w: WatcherFunc): void {
		this._watcherFuncs.push(w);
	}

	async setOrder(order: number) {
		if (this._props.order == order) return;
		this._props.order = order;
		await this._save();
	}

	async setOrderAfter(parent: Category, item?: Item) {
		if (parent.items.map((i) => i.order).some(isNaN)) await parent.sortItems(true);
		const categoryItemOrders = parent.items.map((i) => i.order);
		this._props.order = roundedOrderAfter(categoryItemOrders, item?.order ?? 0);
		await this._save();
	}

	async setLastPosition() {
		const items = this.parent.items;
		if (items.length == 0) this.props.order = 1;
		else this.props.order = +items[items.length - 1].props.order + 1;
		await this._save();
	}

	async setNeededPermission(permission: IPermission) {
		this._neededPermission = permission;
		this._props["private"] = this._neededPermission.getValues();
		await this._save();
	}

	abstract get type(): ItemType;

	abstract updateProps(
		props: ClientArticleProps,
		resourceUpdater: ResourceUpdater,
		rootCategoryProps?: any,
	): Promise<Item<P>>;

	abstract getFileName(): string;

	protected abstract _save(): Promise<void>;
}

type WatcherFunc = (changes: ItemStatus[]) => void;
