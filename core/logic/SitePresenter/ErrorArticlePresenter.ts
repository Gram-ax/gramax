import { Article } from "../FileStructue/Article/Article";
import CustomArticlePresenter from "./CustomArticlePresenter";

export default class ErrorArticlePresenter extends CustomArticlePresenter {
	getErrorArticle(code: string, error?: Error, isLogged?: boolean): Article {
		if (code == "500") return this._createErrorArticle(code, error, isLogged);
		return this.getArticle(code, error, isLogged);
	}
}
