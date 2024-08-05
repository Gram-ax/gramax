import { PCatalogs, PChangeCatalog, PStorage } from "@core/Plugin";
import { IndexData } from "plugins/target/search/src/IndexData";
import htmlToString from "plugins/target/search/src/utils/htmlToString";

export class IndexDataProvider {
	constructor(private _pCatalogs: PCatalogs, private _storage: PStorage) {
		this._pCatalogs.onUpdate(this._getOnChangeRule());
	}

	async getCatalogValue(catalogName: string): Promise<IndexData[]> {
		if (await this._storage.exists(catalogName)) return this._getIndexDataFromStorage(catalogName);
		return this._getAndCreateIndexData(catalogName);
	}

	async deleteCatalogs() {
		const catalogNames = (await this._pCatalogs.getAll()).map((c) => c.getName());
		return Promise.all(
			catalogNames.map(async (catalogName) => {
				if (await this._storage.exists(catalogName)) await this._storage.delete(catalogName);
			}),
		);
	}

	private async _getAndCreateIndexData(catalogName: string): Promise<IndexData[]> {
		const data = await this._getIndexData(catalogName);
		await this._setIndexDataInStorage(catalogName, data);
		return data;
	}

	private _getOnChangeRule() {
		return async (changeItems: PChangeCatalog[]): Promise<void> => {
			const catalogNames = [...new Set(changeItems.map((item) => item.catalog.getName()))];
			await Promise.all(catalogNames.map((catalogName) => this._getAndCreateIndexData(catalogName)));
		};
	}

	private async _getIndexData(catalogName: string): Promise<IndexData[]> {
		const catalog = await this._pCatalogs.get(catalogName);
		const contentItems = catalog.getArticles();

		const indexDataPromises = contentItems.map(async (article) => {
			const content = htmlToString(await article.getHtmlContent());
			return {
				path: article.id,
				// path: article.ref.path.value,
				pathname: await article.getPathname(),
				title: article.getProp("title"),
				content: content ?? "",
				tags: article.getProp("tags")?.join(" "),
			};
		});

		return Promise.all(indexDataPromises);
	}

	private _setIndexDataInStorage(catalogName: string, indexData: IndexData[]): Promise<void> {
		return this._storage.set(catalogName, JSON.stringify(indexData));
	}

	private async _getIndexDataFromStorage(catalogName: string): Promise<IndexData[]> {
		try {
			return this._storage.get(catalogName).then((data) => JSON.parse(data));
		} catch (e) {
			console.log(e);
			return this._getAndCreateIndexData(catalogName);
		}
	}
}
