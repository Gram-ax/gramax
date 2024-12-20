import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import { ItemFilter, type Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import type RuleCollection from "@ext/events/RuleCollection";
import Navigation from "../../../navigation/catalog/main/logic/Navigation";
import { ContentLanguage } from "../model/Language";

export default class LocalizationRules implements RuleCollection, EventHandlerCollection {
	constructor(
		private _nav: Navigation,
		private _currentLanguage?: ContentLanguage,
		private _customArticlePresenter?: CustomArticlePresenter,
	) {}

	mount(): void {
		this._nav.events.on("filter-item", ({ catalog, item }) => {
			if (item.parent.parent || !catalog.props.language) return true;

			if (item.type == ItemType.category) {
				const maybeItemLanguage = ContentLanguage[item.getFileName()];
				return catalog.props.supportedLanguages.includes(maybeItemLanguage)
					? this._currentLanguage == maybeItemLanguage
					: true;
			}

			if (item.type == ItemType.article) {
				return !this._currentLanguage || this._currentLanguage == catalog.props.language;
			}
		});

		this._nav.events.on("before-build-nav-tree", ({ catalog, mutableRoot }) => {
			if (!catalog.props.language) return;
			if (!this._currentLanguage || this._currentLanguage == catalog.props.language) return;

			const root = catalog.findArticle(`${catalog.name}/${this._currentLanguage}`, [
				(i) => i.type == ItemType.category,
			]);

			mutableRoot.root = <Category>root || mutableRoot.root;
		});

		this._nav.events.on("resolve-root-category", ({ catalog, mutableRef }) => {
			if (!catalog.props.language) return;
			if (!this._currentLanguage || this._currentLanguage == catalog.props.language) return;

			const article = catalog.findArticle(
				`${catalog.name}/${this._currentLanguage}`,
				[(i) => i.type == ItemType.category],
				catalog.getRootCategory(),
			);

			if (!article) return;
			mutableRef.ref = { path: article.ref.path.value, storageId: article.ref.storageId };
		});
	}

	getItemFilter() {
		const rule: ItemFilter = (item: Item, catalog: Catalog) => {
			if (!catalog.props.language) return true;

			if (item.type == ItemType.category) {
				const maybeItemLanguage = ContentLanguage[item.getFileName()];
				return catalog.props.supportedLanguages.includes(maybeItemLanguage)
					? this._currentLanguage == maybeItemLanguage
					: true;
			}

			return true;
		};

		if (this._customArticlePresenter) {
			rule.getErrorArticle = (pathname: string) =>
				this._customArticlePresenter.getArticle("Article404", { pathname });
		}
		return rule;
	}
}
