import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import type RuleCollection from "@ext/events/RuleCollection";
import Navigation from "@ext/navigation/catalog/main/logic/Navigation";
import { configureWorkspacePermission, readPermission } from "@ext/security/logic/Permission/Permissions";
import { Item } from "../../../logic/FileStructue/Item/Item";
import IPermission from "./Permission/IPermission";
import Permission from "./Permission/Permission";
import User from "./User/User";

export default class SecurityRules implements RuleCollection, EventHandlerCollection {
	constructor(
		private _currentUser: User,
		private _nav?: Navigation,
		private _customArticlePresenter?: CustomArticlePresenter,
	) {}

	mount(): void {
		this._nav.events.on("filter-item", ({ catalog, item, link }) => {
			if (this._isPrivate(item)) link.icon = "lock-open";
			return (
				this._canRead(item?.neededPermission, catalog.name) &&
				this._canRead(item?.parent?.neededPermission, catalog.name)
			);
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
			if (!this._canRead(currentItem?.neededPermission, catalogName)) return false;
			currentItem = currentItem.parent;
		}
		return true;
	}

	private _canRead(itemPermission: IPermission, catalogName: string): boolean {
		if (!this._currentUser) return false;
		if (this._currentUser.type === "base") return true;
		const user = this._currentUser as EnterpriseUser;
		if (user.workspacePermission.someEnough(configureWorkspacePermission)) return true;
		const baseCatalogName = BaseCatalog.parseName(catalogName).name;
		if (user.catalogPermission.enough(baseCatalogName, readPermission)) return true;
		if (user.catalogPermission.enough(baseCatalogName, itemPermission)) return true;
		return false;
	}

	private _isPrivate(item: Item): boolean {
		return item.neededPermission.isWorked();
	}
}
