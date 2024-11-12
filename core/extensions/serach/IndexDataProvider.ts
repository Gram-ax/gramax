import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { getChildLinks } from "@core/FileStructue/Article/parseContent";
import { Catalog, CatalogFilesUpdated } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import Cache from "@ext/Cache";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { IndexData } from "@ext/serach/IndexData";
import htmlToString from "@ext/serach/utils/htmlToString";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";

export class IndexDataProvider {
	private _onChangeCallbacks: ((catalogName: string, indexData: IndexData[]) => void)[] = [];
	constructor(
		private _wm: WorkspaceManager,
		private _cache: Cache,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
	) {
		this._wm.onCatalogChange(this._getOnChangeRule());
	}

	async getCatalogValue(catalogName: string): Promise<IndexData[]> {
		if (await this._cache.exists(catalogName)) return this._getIndexDataFromStorage(catalogName);
		return this._getAndCreateIndexData(catalogName);
	}

	async deleteCatalogs() {
		const catalogNames = Array.from(this._wm.current().getCatalogEntries().keys());
		return Promise.all(
			catalogNames.map(async (catalogName) => {
				if (await this._cache.exists(catalogName)) await this._cache.delete(catalogName);
			}),
		);
	}

	onDataChange(callback: (catalogName: string, indexData: IndexData[]) => void) {
		this._onChangeCallbacks.push(callback);
	}

	private async _getAndCreateIndexData(catalogName: string): Promise<IndexData[]> {
		const data = await this._getIndexData(catalogName);
		await this._setIndexDataInStorage(catalogName, data);
		return data;
	}

	private _getOnChangeRule() {
		return async (update: CatalogFilesUpdated): Promise<void> => {
			const { items, catalog } = update;

			const oldData = (await this._getIndexDataFromStorage(catalog.getName())).filter((d) =>
				catalog.findItemByItemPath(new Path(d.path)),
			);
			const newData = (
				await Promise.all(
					items.map(async (a) => {
						const article = catalog.findItemByItemRef<Article>(a.ref);
						if (!article) {
							if (a.status !== FileStatus.delete) return { data: null, status: a.status };
							else return { data: { path: a.ref.path.value }, status: a.status };
						}
						const data = await this._getArticleIndexData(catalog, article, true);
						if (!data) return null;
						return { data, status: a.status };
					}),
				)
			).filter((a) => a);

			newData.forEach((iid) => {
				if (iid.status === FileStatus.delete) {
					const itemData = oldData.find((d) => d.path == iid.data.path);
					if (itemData) oldData.splice(oldData.indexOf(itemData), 1);
				}
				if (iid.status === FileStatus.modified || iid.status === FileStatus.new) {
					if (!iid.data) return;
					const itemData = oldData.find((d) => d.path == iid.data.path);
					if (!itemData) return oldData.push(iid.data);
					itemData.title = iid.data.title;
					itemData.content = iid.data.content;
				}
			});
			await this._setIndexDataInStorage(catalog.getName(), oldData);
			this._onChangeCallbacks.forEach((callback) => callback(catalog.getName(), oldData));
		};
	}

	private async _getIndexData(catalogName: string): Promise<IndexData[]> {
		const catalog = await this._wm.current().getCatalog(catalogName);
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
				? getChildLinks(article as Category, catalog, [])
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

	private _setIndexDataInStorage(catalogName: string, indexData: IndexData[]): Promise<void> {
		return this._cache.set(catalogName, JSON.stringify(indexData));
	}

	private async _getIndexDataFromStorage(catalogName: string): Promise<IndexData[]> {
		try {
			const data = await this._cache.get(catalogName);
			return JSON.parse(data);
		} catch (e) {
			console.log(e);
			return this._getAndCreateIndexData(catalogName);
		}
	}
}
