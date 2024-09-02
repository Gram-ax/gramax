import type { HasEvents } from "@core/Event/EventEmitter";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { Item } from "@core/FileStructue/Item/Item";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import { type NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";
import type RuleCollection from "@ext/rules/RuleCollection";

export default class HiddenRules implements RuleCollection {
	constructor(private _customArticlePresenter?: CustomArticlePresenter) {}

	mountWorkspaceEvents(): void {}

	mountNavEvents(nav: HasEvents<NavigationEvents>) {
		nav.events.on("filter-item", ({ item }) => this._isItemHidden(item));
		nav.events.on("filter-catalog", ({ entry }) => !entry.props.hidden);
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
