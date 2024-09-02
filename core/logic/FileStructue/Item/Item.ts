import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import { roundedOrderAfter } from "@core/FileStructue/Item/ItemOrderUtils";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import type { FSLocalizationProps } from "@ext/localization/core/events/FSLocalizationEvents";
import t from "@ext/localization/locale/translate";
import type { FileStatus } from "@ext/Watchers/model/FileStatus";
import IPermission from "../../../extensions/security/logic/Permission/IPermission";
import Permission from "../../../extensions/security/logic/Permission/Permission";
import { ClientArticleProps } from "../../SitePresenter/SitePresenter";
import { Category, type CategoryProps } from "../Category/Category";

export type ItemEvents = Event<"item-order-updated", { item: Item }> &
	Event<"item-saved", { item: Item }> &
	Event<"item-changed", { item: Item; status: FileStatus }>;

export type ItemProps = FSLocalizationProps & {
	title?: string;
	description?: string;
	tags?: string[];
	order?: number;

	logicPath?: string;

	hidden?: boolean;
	private?: string[];
	external?: string;
};

export const ORDERING_MAX_PRECISION = 6;

export abstract class Item<P extends ItemProps = ItemProps> {
	protected _events = createEventEmitter<ItemEvents>();
	private _neededPermission: IPermission = null;

	constructor(
		protected _ref: ItemRef,
		protected _parent: Category,
		protected _props: P,
		protected _logicPath: string,
	) {
		this._neededPermission = new Permission(this._props.private);
	}

	get events() {
		return this._events;
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

	async setOrder(order: number, silent = false) {
		if (this._props.order == order) return;
		this._props.order = order;
		if (!silent) await this.events.emit("item-order-updated", { item: this });
		await this._save();
	}

	async setOrderAfter(parent: Category, item?: Item) {
		if (parent.items.map((i) => i.order).some(isNaN)) await parent.sortItems(true);
		const categoryItemOrders = parent.items.map((i) => i.order);
		this._props.order = roundedOrderAfter(categoryItemOrders, item?.order ?? 0);
		await this.events.emit("item-order-updated", { item: this });
		await this._save();
	}

	async setLastPosition() {
		const items = this.parent.items;
		if (items.length == 0) this.props.order = 1;
		else this.props.order = +items[items.length - 1].props.order + 1;
		await this.events.emit("item-order-updated", { item: this });
		await this._save();
	}

	async setNeededPermission(permission: IPermission) {
		this._neededPermission = permission;
		this._props["private"] = this._neededPermission.getValues();
		await this._save();
	}

	async saveTree() {
		await this.save();
		let target = this.parent;
		while (target?.parent) {
			await target.save();
			target = target.parent;
		}
	}

	abstract get type(): ItemType;

	abstract save(): Promise<void>;

	async updateProps(
		props: ClientArticleProps,
		resourceUpdater: ResourceUpdater,
		rootCategoryProps?: CategoryProps,
		fileNameOnly = false,
	): Promise<Item<P>> {
		!fileNameOnly && (await this._updateProps(props));
		props.fileName && (await this._updateFilename(props.fileName, resourceUpdater, rootCategoryProps));
		return this;
	}

	protected abstract _updateFilename(filename: string, ru: ResourceUpdater, rootProps?: CategoryProps): Promise<this>;
	protected abstract _updateProps(props: ClientArticleProps): Promise<void>;

	abstract getFileName(): string;

	protected abstract _save(): Promise<void>;
}
