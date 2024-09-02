import type { HasEvents } from "@core/Event/EventEmitter";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import { type NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";
import type RuleCollection from "@ext/rules/RuleCollection";
import { Item } from "../../../logic/FileStructue/Item/Item";
import IPermission from "./Permission/IPermission";
import Permission from "./Permission/Permission";
import User from "./User/User";

export default class SecurityRules implements RuleCollection {
	constructor(private _currentUser: User, private _customArticlePresenter?: CustomArticlePresenter) {}

	mountWorkspaceEvents(): void {}

	getItemFilter() {
		const rule: ItemFilter = (article, catalog) => {
			const catalogName = catalog.getName();
			return this._canReadItem(article, catalogName);
		};

		if (this._customArticlePresenter) {
			(rule as any).getErrorArticle = () => this._customArticlePresenter.getArticle("403");
		}
		return rule;
	}

	mountNavEvents(nav: HasEvents<NavigationEvents>) {
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

	private _canReadItem(item: Item, catalogName: string): boolean {
		let currentItem = item;
		while (currentItem) {
			if (!this._canRead(currentItem?.neededPermission, catalogName)) return false;
			currentItem = currentItem.parent;
		}
		return true;
	}

	private _canRead(itemPermission: IPermission, catalogName: string): boolean {
		if (!itemPermission) return true;
		if (!itemPermission.isWorked()) return true;
		if (!this._currentUser) return false;
		if (itemPermission.enough(this._currentUser.getGlobalPermission())) return true;
		if (itemPermission.enough(this._currentUser.getCatalogPermission(catalogName))) return true;
		return false;
	}

	private _isPrivate(item: Item): boolean {
		return item.neededPermission.isWorked();
	}
}
