import { Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { NavRules } from "@ext/navigation/catalog/main/logic/Navigation";
import Rules from "@ext/rules/Rule";
import ErrorArticlePresenter from "../../../SitePresenter/ErrorArticlePresenter";
import { Item } from "../../Item/Item";
import type { ArticleProps } from "@core/FileStructue/Article/Article";

export default class HiddenRules implements Rules {
	constructor(private _errorArticlePresenter?: ErrorArticlePresenter) {}

	getItemFilter(): (item: Item<ArticleProps>, catalog: Catalog) => boolean {
		const rule: ItemFilter = (item) => {
			return item.props.hidden !== true && item?.parent?.props?.hidden !== true;
		};
		if (this._errorArticlePresenter) {
			(rule as any).errorArticle = this._errorArticlePresenter.getErrorArticle("404");
		}
		return rule;
	}

	getNavRules(): NavRules {
		return {
			itemRule: this.getItemFilter.bind(this),
		};
	}
}