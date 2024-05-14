import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { Item } from "@core/FileStructue/Item/Item";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import { NavRules } from "@ext/navigation/catalog/main/logic/Navigation";
import Rules from "@ext/rules/Rule";

export default class HiddenRules implements Rules {
	constructor(private _сustomArticlePresenter?: CustomArticlePresenter) {}

	getItemFilter(): ItemFilter {
		const rule: ItemFilter = this._check.bind(this);
		if (this._сustomArticlePresenter) {
			(rule as any).errorArticle = this._сustomArticlePresenter.getArticle("404");
		}
		return rule;
	}

	getNavRules(): NavRules {
		return {
			itemRule: (_, item) => this._check(item),
			catalogRule: (entry) => !entry.props.hidden,
		};
	}

	private _check(item: Item) {
		return item.props.hidden !== true && item?.parent?.props?.hidden !== true;
	}
}
