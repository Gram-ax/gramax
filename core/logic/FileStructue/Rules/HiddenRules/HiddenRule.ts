import ErrorArticlePresenter from "../../../SitePresenter/ErrorArticlePresenter";
import { Article } from "../../Article/Article";
import { Catalog } from "../../Catalog/Catalog";
import { Item } from "../../Item/Item";

export default class HiddenRule {
	constructor(private _errorArticlePresenter?: ErrorArticlePresenter) {}

	getFilterRule() {
		const rule = (article: Article): boolean => {
			return this.getItemRule()(null, article);
		};

		if (this._errorArticlePresenter) {
			(rule as any).errorArticle = this._errorArticlePresenter.getErrorArticle("404");
		}
		return rule;
	}

	getItemRule() {
		return (catalog: Catalog, item: Item) => {
			return item.props[hiddenProps.hidden] !== true && item?.parent?.props?.[hiddenProps.hidden] !== true;
		};
	}
}

export enum hiddenProps {
	hidden = "hidden",
}
