import Path from "@core/FileProvider/Path/Path";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import Rules from "@ext/rules/Rule";
import { NavRules, navProps } from "../../../navigation/catalog/main/logic/Navigation";
import Language, { defaultLanguage } from "../model/Language";

export default class LocalizationRules implements Rules {
	private _currentLanguage: Language;

	constructor(language: Language, private _customArticlePresenter?: CustomArticlePresenter) {
		this._currentLanguage = language ?? defaultLanguage;
	}

	getItemFilter() {
		const rule: ItemFilter = (article, catalog) => {
			const catalogName = catalog.getName();
			if (new Path(article.logicPath).name == catalogName) return true;
			if (!article.props.lang) article.props.lang = defaultLanguage;
			return article.props.lang === this._currentLanguage;
		};

		if (this._customArticlePresenter) {
			(rule as any).errorArticle = this._customArticlePresenter.getArticle("Article404");
		}
		return rule;
	}

	getNavRules(): NavRules {
		return {
			itemRule: (catalog, item, itemLink) => {
				const langTitle = item?.props?.["title_" + this._currentLanguage];
				if (langTitle) itemLink.title = langTitle;
				return (item.props.lang ?? defaultLanguage) == this._currentLanguage;
			},

			catalogRule: (catalog, catalogLink) => {
				if (this._currentLanguage != defaultLanguage) {
					catalogLink.description = catalog.props[navProps.description + "_" + this._currentLanguage] ?? null;
				}
				const prop = catalog.props.catalogLangs;
				return prop?.has(this._currentLanguage) ?? true;
			},
		};
	}
}
