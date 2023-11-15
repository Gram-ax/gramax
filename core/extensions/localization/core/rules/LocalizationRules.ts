import Path from "@core/FileProvider/Path/Path";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { Article } from "../../../../logic/FileStructue/Article/Article";
import { Catalog } from "../../../../logic/FileStructue/Catalog/Catalog";
import { Item } from "../../../../logic/FileStructue/Item/Item";
import ErrorArticlePresenter from "../../../../logic/SitePresenter/ErrorArticlePresenter";
import { CatalogLink, ItemLink } from "../../../navigation/NavigationLinks";
import { navProps } from "../../../navigation/catalog/main/logic/Navigation";
import Language, { defaultLanguage } from "../model/Language";
import { localizationProps } from "./FSLocalizationRules";

export default class LocalizationRules {
	private _currentLanguage: Language;

	constructor(private _errorArticlePresenter: ErrorArticlePresenter, language: Language) {
		this._currentLanguage = language ?? defaultLanguage;
	}

	getFilterRule() {
		const rule = (article: Article, catalogName: string): boolean => {
			if (new Path(article.logicPath).name == catalogName) return true;
			if (!article.props[localizationProps.language]) article.props[localizationProps.language] = defaultLanguage;
			return article.props[localizationProps.language] == this._currentLanguage;
		};

		(rule as any).errorArticle = this._errorArticlePresenter.getErrorArticle("404");
		return rule;
	}

	getNavCatalogRule() {
		return (catalog: CatalogEntry, catalogLink: CatalogLink): boolean => {
			if (this._currentLanguage != defaultLanguage) {
				catalogLink.description = catalog.props[navProps.description + "_" + this._currentLanguage] ?? null;
			}
			const prop = catalog.props[localizationProps.languages] as Set<string>;
			return prop?.has(this._currentLanguage) ?? true;
		};
	}

	getNavItemRule() {
		return (catalog: Catalog, item: Item, itemLink: ItemLink): boolean => {
			const langTitle = item?.props?.["title_" + this._currentLanguage];
			if (langTitle) itemLink.title = langTitle;
			return (item.props[localizationProps.language] ?? defaultLanguage) == this._currentLanguage;
		};
	}
}
