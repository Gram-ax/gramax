import Path from "@core/FileProvider/Path/Path";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import catalogError404 from "@core/SitePresenter/customArticles/catalogError404";
import CustomArticle from "@core/SitePresenter/customArticles/model/CustomArticle";

import matter from "gray-matter";
import { Article, type ArticleProps } from "../FileStructue/Article/Article";
import articleError404 from "./customArticles/articleError404";
import error403 from "./customArticles/error403";
import error500 from "./customArticles/error500";
import initSource from "./customArticles/initSource";
import welcome from "./customArticles/welcome";

const articles: Record<CustomArticle, (props?: Record<string, string>) => string> = {
	welcome,
	initSource,
	403: error403,
	Article404: articleError404,
	Catalog404: catalogError404,
	500: error500,
};

const errorCodes: Record<CustomArticle, number> = {
	welcome: null,
	initSource: null,
	403: 403,
	Article404: 404,
	Catalog404: 404,
	500: 500,
};

export default class CustomArticlePresenter {
	private _customArticles: { [name: string]: Article } = {};

	getArticle(name: CustomArticle, props?: Record<string, string>, ref?: ItemRef): Article {
		if (name == "500") return this._createErrorArticle(name, props, ref);
		if (!this._customArticles[name] || props) this._customArticles[name] = this._createErrorArticle(name, props);
		return this._customArticles[name];
	}

	protected _createErrorArticle(name: CustomArticle, props?: Record<string, string>, ref?: ItemRef): Article {
		const md = matter(articles[name](props));
		const errorCode = errorCodes[name];

		return new Article({
			ref: ref ?? {
				path: Path.empty,
				storageId: "",
			},
			content: md.content ?? "",
			parent: null,
			props: md.data as ArticleProps,
			logicPath: name,
			lastModified: new Date().getTime(),
			errorCode,
			fs: null,
		});
	}
}
