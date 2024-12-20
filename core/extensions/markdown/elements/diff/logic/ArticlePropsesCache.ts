import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";

export default class ArticlePropsesCache {
	private static _cache: { [path: string]: ClientArticleProps } = {};

	static get cache() {
		return this._cache;
	}

	static clear() {
		this._cache = {};
	}
}
