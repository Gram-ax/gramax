import { ChangeCatalog } from "@core/FileStructue/Catalog/Catalog";
import Library from "@core/Library/Library";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import IndexCacheProvider from "@ext/search/IndexCacheProvider";
import { IndexData } from "@ext/search/IndexData";
import searchUtils from "@ext/search/searchUtils";

export class IndexDataProvider {
	constructor(
		private _lib: Library,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _indexCacheProvider: IndexCacheProvider,
	) {
		this._lib.addOnChangeRule(this._onChangeRule.bind(this));
	}

	async getCatalogValue(catalogName: string): Promise<IndexData[]> {
		if (await this._indexCacheProvider.exists(catalogName)) return this._indexCacheProvider.get(catalogName);
		return this._setCatalog(catalogName);
	}

	async deleteCatalogs() {
		const catalogNames = Array.from(this._lib.getCatalogEntries().values()).map((c) => c.getName());
		for (const catalogName of catalogNames) await this._indexCacheProvider.remove(catalogName);
	}

	private async _setCatalog(catalogName: string): Promise<IndexData[]> {
		const data = await this._getIndexData(catalogName);
		await this._indexCacheProvider.set(catalogName, data);
		return data;
	}

	private async _onChangeRule(changeItems: ChangeCatalog[]) {
		const catalogNames = [...new Set(changeItems.map((item) => item.catalog.getName()))];
		await Promise.all(catalogNames.map(async (catalogName) => this._setCatalog(catalogName)));
	}

	private async _getIndexData(catalogName: string): Promise<IndexData[]> {
		const catalog = await this._lib.getCatalog(catalogName);
		const contentItems = catalog.getContentItems();

		const indexDataPromises = contentItems.map(async (article) => {
			const content = await searchUtils.getIndexContent(
				catalog,
				article,
				this._parser,
				this._parserContextFactory,
			);
			return {
				path: article.ref.path.value,
				pathname: await catalog.getPathname(article),
				title: article.getTitle(),
				content: content ?? "",
				tags: article.props["tags"]?.join(" "),
			};
		});

		return Promise.all(indexDataPromises);
	}
}
