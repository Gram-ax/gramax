import { CatalogList, CatalogNavigation } from "@ext/publicApi/types";

export default class GramaxApi {
	constructor(private _instanceUrl: string) {}

	public async getCatalogs(): Promise<CatalogList> {
		const response = await this._api(`api/catalogs/`);
		return response.json();
	}

	public async getCatalogNavigation(catalogId: string): Promise<CatalogNavigation> {
		const response = await this._api(`api/catalogs/${catalogId}/navigation`);
		return response.json();
	}

	public async getArticleHtml(catalogId: string, articleId: string) {
		const response = await this._api(`api/catalogs/${catalogId}/articles/${encodeURIComponent(articleId)}/html`);
		return response.text();
	}

	public async getResource(catalogId: string, articleId: string, resourcePath: string) {
		const response = await this._api(
			`api/catalogs/${catalogId}/articles/${encodeURIComponent(articleId)}/resources/${encodeURIComponent(
				resourcePath,
			)}`,
		);
		return { contentType: response.headers.get("Content-Type"), arrayBuffer: await response.arrayBuffer() };
	}

	private async _api(url: string): Promise<Response> {
		const fetchUrl = `${this._instanceUrl}/${url}`;
		const res = await fetch(fetchUrl, { method: "GET" });
		if (!res.ok) throw this._generateError(res, (await res.json()).message);
		return res;
	}

	protected _generateError(res: Response, message?: string): Error {
		const error = new Error(`Error ${res.status} - ${res.statusText}${message ? `. Message: '${message}'` : ""}`);
		(error as any).code = res.status;
		return error;
	}
}
