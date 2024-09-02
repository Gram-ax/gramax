import Url from "@core-ui/ApiServices/Types/Url";
import { getArticleId } from "@ext/publicApi/TransformData";

export default class PublicApiUrlCreator {
	private _articleId: string;
	constructor(private _catalogName: string, articlePath: string, private _basePath: string) {
		this._articleId = encodeURIComponent(getArticleId(_catalogName, articlePath));
	}

	public getApiArticle(link: string, hash?: string) {
		const articleId = getArticleId(this._catalogName, link);
		return Url.fromBasePath(
			`/api/catalogs/${this._catalogName}/articles/${encodeURIComponent(articleId)}/html${hash ?? ""}`,
			this._basePath,
		);
	}

	public getApiArticleResource(src: string) {
		return Url.fromBasePath(
			`/api/catalogs/${this._catalogName}/articles/${this._articleId}/resources/${encodeURIComponent(src)}`,
			this._basePath,
		);
	}
}
