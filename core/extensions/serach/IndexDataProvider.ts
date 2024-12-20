import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { getChildLinks } from "@core/FileStructue/Article/parseContent";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogFilesUpdated } from "@core/FileStructue/Catalog/CatalogEvents";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import Cache from "@ext/Cache";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { IndexData } from "@ext/serach/IndexData";
import htmlToString from "@ext/serach/utils/htmlToString";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";

export class IndexDataProvider {
	constructor(
		private _wm: WorkspaceManager,
		private _cache: Cache,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
	) {
		this._wm.onCatalogChange(this._getOnChangeRule());
	}

	async getIndexData(catalogName: string, articlePaths: string[]): Promise<IndexData[]> {
		return this._getIndexDataFromStorage(catalogName, articlePaths);
	}

	async clear() {
		const catalogNames = Array.from(this._wm.current().getAllCatalogs().keys());
		return Promise.all(
			catalogNames.map(async (catalogName) => {
				if (await this._cache.exists(catalogName)) await this._cache.delete(catalogName);
			}),
		);
	}

	private _getOnChangeRule() {
		return async (update: CatalogFilesUpdated): Promise<void> => {
			const { items, catalog } = update;

			const oldData = await this._getIndexDataFromStorage(catalog.name);
			const removedPaths = items.map((i) => i.ref.path.value);
			const newData = oldData.filter((d) => d?.path && !removedPaths.includes(d?.path));

			await this._setIndexDataInStorage(catalog.name, newData);
		};
	}

	private _setIndexDataInStorage(catalogName: string, indexData: IndexData[]): Promise<void> {
		return this._cache.set(catalogName, JSON.stringify(indexData));
	}

	private async _getIndexDataFromStorage(catalogName: string, articlePaths?: string[]): Promise<IndexData[]> {
		let result: IndexData[] = [];
		if (await this._cache.exists(catalogName)) {
			try {
				const data = await this._cache.get(catalogName);
				result = JSON.parse(data);
			} catch {
				return await this._getAndCreateIndexData(catalogName);
			}
		} else return await this._getAndCreateIndexData(catalogName);

		if (!articlePaths) return result;

		const noIndexDatas = articlePaths.filter((p) => !result.some((d) => d?.path === p));
		if (!noIndexDatas.length) return result;

		const catalog = await this._wm.current().getContextlessCatalog(catalogName);
		if (!catalog) return result;

		for (const noIndexData of noIndexDatas) {
			const item = catalog.findItemByItemPath<Article>(new Path(noIndexData));
			if (!item) continue;

			const newData = await this._getArticleIndexData(catalog, item);
			if (!newData) continue;

			result.push(newData);
		}

		await this._setIndexDataInStorage(catalogName, result);
		return result;
	}

	private async _getAndCreateIndexData(catalogName: string): Promise<IndexData[]> {
		const data = await this._getIndexData(catalogName);
		await this._setIndexDataInStorage(catalogName, data);
		return data;
	}

	private async _getIndexData(catalogName: string): Promise<IndexData[]> {
		const catalog = await this._wm.current().getContextlessCatalog(catalogName);
		const contentItems = catalog.getItems();
		return (
			await Promise.all(contentItems.map(async (a) => this._getArticleIndexData(catalog, a as Article)))
		).filter((a) => a);
	}

	private async _getArticleIndexData(catalog: Catalog, article: Article, forceParse = false): Promise<IndexData> {
		try {
			const context = this._parserContextFactory.fromArticle(article, catalog, defaultLanguage, true);
			const content = article.content
				? article.content
				: article.type === ItemType.category
				? getChildLinks()
				: "";

			const html =
				article.parsedContent && !forceParse
					? article.parsedContent.htmlValue
					: await this._parser.parseToHtml(content, context);
			return {
				path: article.ref.path.value,
				pathname: await catalog.getPathname(article),
				title: article.props.title ?? "",
				content: htmlToString(html) ?? "",
			};
		} catch {
			return null;
		}
	}
}
