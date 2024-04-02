import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import { NavRules } from "@ext/navigation/catalog/main/logic/Navigation";
import Rules from "@ext/rules/Rule";
import { Item } from "../../../logic/FileStructue/Item/Item";
import IPermission from "./Permission/IPermission";
import Permission from "./Permission/Permission";
import User from "./User/User";

export default class SecurityRules implements Rules {
	constructor(private _currentUser: User, private _customArticlePresenter?: CustomArticlePresenter) {}

	getItemFilter() {
		const rule: ItemFilter = (article, catalog) => {
			const catalogName = catalog.getName();
			return this._canReadItem(article, catalogName);
		};

		if (this._customArticlePresenter) {
			(rule as any).errorArticle = this._customArticlePresenter.getArticle("403");
		}
		return rule;
	}

	getNavRules(): NavRules {
		return {
			itemRule: (catalog, item, itemLink) => {
				if (this._isPrivate(item)) itemLink.icon = "unlock";
				return (
					this._canRead(item?.neededPermission, catalog.getName()) &&
					this._canRead(item?.parent?.neededPermission, catalog.getName())
				);
			},

			catalogRule: (catalog) => {
				return this._canRead(catalog.perms, catalog.getName());
			},

			relatedLinkRule: (catalog, relatedLinks) => {
				return this._canRead(new Permission(relatedLinks.private), catalog.getName());
			},
		};
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
