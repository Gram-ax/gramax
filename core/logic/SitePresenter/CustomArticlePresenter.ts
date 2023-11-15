import matter from "gray-matter";
import Path from "../FileProvider/Path/Path";
import { Article } from "../FileStructue/Article/Article";
import error403 from "./customArticles/error403";
import error404 from "./customArticles/error404";
import error500 from "./customArticles/error500";
import homePage from "./customArticles/homePage";
import initSource from "./customArticles/initSource";
import newArticle from "./customArticles/newArticle";

const articles = {
	newArticle: newArticle,
	initSource: initSource,
	homePage: homePage,
	403: error403,
	404: error404,
	500: error500,
};

export default class CustomArticlePresenter {
	private _customArticles: { [name: string]: Article } = {};

	getArticle(name: string, error?: Error, isLogged?: boolean): Article {
		if (!this._customArticles[name]) this._customArticles[name] = this._createErrorArticle(name, error, isLogged);
		return this._customArticles[name];
	}

	protected _createErrorArticle(name: string, error?: Error, isLogged?: boolean): Article {
		const errorMessage = isLogged && error ? `\n[error:${error.message}]${error.stack}[/error]` : "";
		const md = matter(articles[name] + errorMessage);
		const path = name;
		const errorCode = Number(name);

		return new Article({
			ref: {
				path: Path.empty,
				storageId: "",
			},
			content: md.content ?? "",
			parent: null,
			props: md.data,
			logicPath: path,
			lastModified: new Date().getTime(),
			errorCode: errorCode ? errorCode : null,
			fs: null,
		});
	}
}
