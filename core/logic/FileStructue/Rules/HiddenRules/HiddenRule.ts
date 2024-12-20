import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { Item } from "@core/FileStructue/Item/Item";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import type RuleCollection from "@ext/events/RuleCollection";
import type Navigation from "@ext/navigation/catalog/main/logic/Navigation";

export default class HiddenRules implements RuleCollection, EventHandlerCollection {
	constructor(private _nav?: Navigation, private _customArticlePresenter?: CustomArticlePresenter) {}

	mount() {
		this._nav.events.on("filter-item", ({ item }) => this._isItemHidden(item));
		this._nav.events.on("filter-catalog", ({ entry }) => !entry.props.hidden);
	}

	getItemFilter(): ItemFilter {
		const rule: ItemFilter = this._isItemHidden.bind(this);
		if (this._customArticlePresenter) {
			rule.getErrorArticle = (pathname: string) =>
				this._customArticlePresenter.getArticle("Article404", { pathname });
		}
		return rule;
	}

	private _isItemHidden(item: Item) {
		return item.props.hidden !== true && item?.parent?.props?.hidden !== true;
	}
}
