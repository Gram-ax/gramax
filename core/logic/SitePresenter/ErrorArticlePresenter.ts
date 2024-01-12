import { ItemRef } from "@core/FileStructue/Item/Item";
import { Article } from "../FileStructue/Article/Article";
import CustomArticlePresenter from "./CustomArticlePresenter";

export default class ErrorArticlePresenter extends CustomArticlePresenter {
	getErrorArticle(code: string, error?: Error, isLogged?: boolean, ref?: ItemRef): Article {
		if (code == "500") return this._createErrorArticle(code, error, isLogged, ref);
		return this.getArticle(code, error, isLogged);
	}
}
