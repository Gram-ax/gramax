import { type Environment, getExecutingEnvironment } from "@app/resolveModule/env";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import type RuleCollection from "@ext/events/RuleCollection";
import type Navigation from "@ext/navigation/catalog/main/logic/Navigation";
import { configureWorkspacePermission, readPermission } from "@ext/security/logic/Permission/Permissions";
import type { Item } from "../../../logic/FileStructue/Item/Item";
import type IPermission from "./Permission/IPermission";
import Permission from "./Permission/Permission";
import type User from "./User/User";

export default class SecurityRules implements RuleCollection, EventHandlerCollection {
	private _environment: Environment;
	constructor(
		private _currentUser: User,
		private _nav?: Navigation,
		private _customArticlePresenter?: CustomArticlePresenter,
	) {
		this._environment = getExecutingEnvironment();
	}

	static canReadCatalog(user: User, catalogPerms: IPermission, catalogName: string): boolean {
		return canReadImpl(getExecutingEnvironment(), user, catalogName, catalogPerms);
	}

	mount(): void {
		this._nav.events.on("filter-item", ({ catalog, item, link }) => {
			if (this._isPrivate(item)) link.icon = "lock-open";
			return this._canReadItem(item, catalog.name);
		});

		this._nav.events.on("filter-catalog", ({ entry }) => this._canRead(entry.perms, entry.name));

		this._nav.events.on("filter-related-links", ({ catalog, mutableLinks }) => {
			mutableLinks.links = mutableLinks.links.filter((link) =>
				this._canRead(new Permission(link.private), catalog.name),
			);
		});
	}

	mountWorkspaceEvents(): void {}

	getItemFilter() {
		const rule: ItemFilter = (article, catalog) => {
			const catalogName = catalog.name;
			return this._canReadItem(article, catalogName);
		};

		if (this._customArticlePresenter) {
			rule.getErrorArticle = () => this._customArticlePresenter.getArticle("403");
		}
		return rule;
	}

	private _canReadItem(item: Item, catalogName: string): boolean {
		let currentItem = item;
		while (currentItem) {
			if (this._canRead(currentItem?.neededPermission, catalogName)) return true;
			currentItem = currentItem.parent;
		}
		return false;
	}

	private _canRead(itemPermission: IPermission, catalogName: string): boolean {
		return canReadImpl(this._environment, this._currentUser, catalogName, itemPermission);
	}

	private _isPrivate(item: Item): boolean {
		return item.neededPermission.isWorked();
	}
}

function canReadImpl(environment: Environment, user: User, catalogName: string, itemPermission: IPermission): boolean {
	if (environment !== "next" && environment !== "test") return true;
	if (!user) return false;
	if (user.type === "base") return true;
	const baseCatalogName = BaseCatalog.parseName(catalogName).name;

	if (user.workspacePermission.someEnough(configureWorkspacePermission)) return true;
	if (user.catalogPermission.enough(baseCatalogName, readPermission)) return true;
	if (user.catalogPermission.enough(baseCatalogName, itemPermission)) return true;
	return false;
}
