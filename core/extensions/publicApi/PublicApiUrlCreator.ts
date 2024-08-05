import Url from "@core-ui/ApiServices/Types/Url";

export default class PublicApiUrlCreator {
	constructor(private _catalogName: string, private _articlePath: string, private _basePath: string) {}
	public getApiArticle(link: string, hash?: string) {
		return Url.fromBasePath(
			`/api/catalogs/${this._catalogName}/articles/${encodeURIComponent(link)}/html${hash ?? ""}`,
			this._basePath,
		);
	}

	public getApiArticleResource(src: string) {
		return Url.fromBasePath(
			`/api/catalogs/${this._catalogName}/articles/${this._articlePath}/resources/${encodeURIComponent(src)}`,
			this._basePath,
		);
	}
}
