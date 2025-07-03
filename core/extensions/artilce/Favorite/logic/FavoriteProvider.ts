import { CATALOG_KEY, ARTICLE_KEY } from "@ext/artilce/Favorite/models/consts";

class FavoriteProvider {
	constructor(private _workspaceName: string) {}

	public getFavoriteArticlePaths(catalogName: string): string[] {
		const favoriteArticles = this._getData(this._getLocalstorageKey(catalogName, ARTICLE_KEY));
		if (!favoriteArticles) return [];

		return favoriteArticles.split(",").filter((v) => v.length);
	}

	public setFavoriteArticlePaths(catalogName: string, favoriteArticlePaths: string[]) {
		if (!favoriteArticlePaths.length) {
			this._removeData(this._getLocalstorageKey(catalogName, ARTICLE_KEY));
			return;
		}

		this._setData(this._getLocalstorageKey(catalogName, ARTICLE_KEY), favoriteArticlePaths);
	}

	public getFavoriteCatalogNames(): string[] {
		const favoriteCatalogNames = this._getData(this._getLocalstorageKey(CATALOG_KEY));
		if (!favoriteCatalogNames) return [];

		return favoriteCatalogNames.split(",").filter((v) => v.length);
	}

	public setFavoriteCatalogNames(favoriteCatalogNames: string[]) {
		if (!favoriteCatalogNames.length) {
			this._removeData(this._getLocalstorageKey(CATALOG_KEY));
			return;
		}

		this._setData(this._getLocalstorageKey(CATALOG_KEY), favoriteCatalogNames);
	}

	private _setData(key: string, data: string[]) {
		localStorage.setItem(key, data.join(","));
	}

	private _getData(key: string): string {
		const data = localStorage.getItem(key);
		if (!data) return null;
		return data;
	}

	private _removeData(key: string) {
		localStorage.removeItem(key);
	}

	private _getLocalstorageKey(catalogKey: string, articleKey?: string) {
		return articleKey
			? `${this._workspaceName}/${catalogKey}/${articleKey}`
			: `${this._workspaceName}/${catalogKey}`;
	}
}

export default FavoriteProvider;
