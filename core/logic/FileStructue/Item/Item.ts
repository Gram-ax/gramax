import { NEW_ARTICLE_REGEX } from "@app/config/const";
import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { roundedOrderAfter } from "@core/FileStructue/Item/ItemOrderUtils";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type Hasher from "@core/Hash/Hasher";
import type { Hashable } from "@core/Hash/Hasher";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import { InboxProps } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import IPermission from "../../../extensions/security/logic/Permission/IPermission";
import Permission from "../../../extensions/security/logic/Permission/Permission";
import { ClientArticleProps } from "../../SitePresenter/SitePresenter";
import { Category } from "../Category/Category";

export type ItemEvents = Event<"item-order-updated", { item: Item }> &
	Event<"item-pre-save", { item: Item; mutable: { content: string; props: ItemProps } }> &
	Event<"item-saved", { item: Item }> &
	Event<"item-changed", { item: Item; status: FileStatus }> &
	Event<"item-update-content", { item: Item }> &
	Event<"item-get-content", { item: Item; mutableContent: { content: string } }>;

declare module "@core/FileStructue/Item/Item" {
	interface ItemProps {
		title?: string;
		description?: string;
		tags?: string[];
		order?: number;
		logicPath?: string;

		hidden?: boolean;
		private?: string[];
		external?: string;

		shouldBeCreated?: boolean;

		searchPhrases?: string[];
	}
}

export type UpdateItemProps = (ItemProps & { fileName?: never; logicPath: string }) | ClientArticleProps | InboxProps;

export const ORDERING_MAX_PRECISION = 6;

export abstract class Item<P extends ItemProps = ItemProps> implements Hashable {
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
		return this._props.order;
	}

	getTitle(): string {
		if (this.props.external) return this.props.external;
		const isNewArticle = NEW_ARTICLE_REGEX.test(this.getFileName());
		return this.props.title?.length
			? this.props.title
			: isNewArticle
			? t("article.no-name")
			: this.getFileName() || t("article.no-name");
	}

	async setOrder(order: number, silent = false) {
		if (this._props.order == order) return;
		this._props.order = order;
		if (!silent) await this.events.emit("item-order-updated", { item: this });
		await this._save();
	}

	async setOrderAfter(parent: Category, item?: Item) {
		const orders = parent.items.map((i) => i.order);
		const hasInvalidOrders = orders.some(isNaN);
		const hasDuplicates = new Set(orders).size !== orders.length;

		if (hasInvalidOrders || hasDuplicates) await parent.sortItems("force");

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

	async hash(hash: Hasher) {
		hash.hash(this.props.title);
		hash.hash(this.props.description);
		hash.hash(this.props.order);
		hash.hash(this.props.private);
		return Promise.resolve(hash);
	}

	abstract get type(): ItemType;

	abstract save(): Promise<void>;

	async updateProps(
		props: UpdateItemProps,
		resourceUpdater: ResourceUpdater,
		catalog: Catalog,
		fileNameOnly = false,
	): Promise<Item<P>> {
		!fileNameOnly && this._updateProps(props);

		const previousFilename = this.getFileName();
		const shouldUpdateFilename = props.fileName && previousFilename != props.fileName;
		if (props.fileName) await this._updateFilename(props.fileName, resourceUpdater, catalog);
		if (shouldUpdateFilename) await this.events.emit("item-changed", { item: this, status: FileStatus.delete });
		await this._save(shouldUpdateFilename);
		return this;
	}

	protected abstract _updateFilename(filename: string, ru: ResourceUpdater, catalog: Catalog): Promise<this>;
	protected abstract _updateProps(props: UpdateItemProps): void;

	abstract getFileName(): string;

	protected abstract _save(renamed?: boolean): Promise<void>;
}
