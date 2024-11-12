import type { HasEvents } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import type RuleCollection from "@ext/events/RuleCollection";
import { type NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";
import { readPermission } from "@ext/security/logic/Permission/Permissions";
import { Item } from "../../../logic/FileStructue/Item/Item";
import IPermission from "./Permission/IPermission";
import Permission from "./Permission/Permission";
import User from "./User/User";

export default class SecurityRules implements RuleCollection, EventHandlerCollection<NavigationEvents> {
	constructor(private _currentUser: User, private _customArticlePresenter?: CustomArticlePresenter) {}

	mount(nav: HasEvents<NavigationEvents>): void {
		nav.events.on("filter-item", ({ catalog, item, link }) => {
			if (this._isPrivate(item)) link.icon = "lock-open";
			return (
				this._canRead(item?.neededPermission, catalog.getName()) &&
				this._canRead(item?.parent?.neededPermission, catalog.getName())
			);
		});

		nav.events.on("filter-catalog", ({ entry }) => this._canRead(entry.perms, entry.getName()));

		nav.events.on("filter-related-links", ({ catalog, mutableLinks }) => {
			mutableLinks.links = mutableLinks.links.filter((link) =>
				this._canRead(new Permission(link.private), catalog.getName()),
			);
		});
	}

	mountWorkspaceEvents(): void {}

	getItemFilter() {
		const rule: ItemFilter = (article, catalog) => {
			const catalogName = catalog.getName();
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
		const enterpriseUser = this._currentUser as EnterpriseUser;
		if (readPermission.enough(enterpriseUser.getGlobalPermission())) return true;
		if (readPermission.enough(enterpriseUser.getEnterprisePermission(catalogName))) return true;
		if (itemPermission?.enough?.(enterpriseUser.getCatalogPermission(catalogName))) return true;
		return false;
	}

	private _isPrivate(item: Item): boolean {
		return item.neededPermission.isWorked();
	}
}
