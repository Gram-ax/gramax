import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { Article } from "../../../logic/FileStructue/Article/Article";
import { Catalog } from "../../../logic/FileStructue/Catalog/Catalog";
import { Item } from "../../../logic/FileStructue/Item/Item";
import ErrorArticlePresenter from "../../../logic/SitePresenter/ErrorArticlePresenter";
import { ItemLink, TitledLink } from "../../navigation/NavigationLinks";
import IPermission from "./Permission/IPermission";
import Permission from "./Permission/Permission";
import User from "./User/User";

export default class SecurityRules {
	constructor(private _errorArticlePresenter: ErrorArticlePresenter, private _currentUser: User) {}

	getFilterRule() {
		const rule = (article: Article, catalogName: string): boolean => {
			return this._canReadItem(article, catalogName);
		};

		(rule as any).errorArticle = this._errorArticlePresenter.getErrorArticle("403");
		return rule;
	}

	getNavCatalogRule() {
		return (catalog: CatalogEntry): boolean => {
			return this._canRead(catalog.perms, catalog.name);
		};
	}

	getNavItemRule() {
		return (catalog: Catalog, item: Item, itemLink: ItemLink): boolean => {
			if (this._isPrivate(item)) itemLink.icon = "unlock";
			return (
				this._canRead(item?.neededPermission, catalog.getName()) &&
				this._canRead(item?.parent?.neededPermission, catalog.getName())
			);
		};
	}

	getNavRelationRule() {
		return (catalog: Catalog, relatedLinks: TitledLink): boolean => {
			return this._canRead(new Permission(relatedLinks.private), catalog.getName());
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
