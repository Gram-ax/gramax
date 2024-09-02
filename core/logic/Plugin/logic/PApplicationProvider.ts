import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import { ArticleFilter, Catalog, type CatalogFilesUpdated } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { ArticleType, PApplication, PArticle, PCatalog, PCategory, PChangeCatalog } from "@core/Plugin";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import itemRefConverter from "@core/Plugin/logic/utils/itemRefConverter";
import HtmlParser from "@ext/html/HtmlParser";
import RuleProvider from "@ext/rules/RuleProvider";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";

export default class PApplicationProvider {
	constructor(private _wm: WorkspaceManager, private _htmlParser: HtmlParser, private _pluginsCache: PluginsCache) {}

	async getApp(pluginName: string, context: Context): Promise<PApplication> {
		const rules = new RuleProvider(context);
		const filters = rules.getItemFilters();
		const pluginNameCache = await this._pluginsCache.getPluginStorage(pluginName);
		return {
			storage: {
				get: pluginNameCache.get.bind(pluginNameCache),
				set: pluginNameCache.set.bind(pluginNameCache),
				delete: pluginNameCache.delete.bind(pluginNameCache),
				exists: pluginNameCache.exists.bind(pluginNameCache),
			},
			catalogs: {
				get: async (name) => {
					return this._getCatalog(await this._wm.current().getCatalog(name), filters);
				},
				getAll: async () => {
					const res: PCatalog[] = [];
					for (const entry of this._wm.current().getCatalogEntries().values()) {
						res.push(this._getCatalog(await entry.load(), filters));
					}
					return res;
				},
				onUpdate: (callback) => {
					this._wm.onCatalogChange((update) => {
						void callback(this._convertCatalogFilesUpdate(update, filters));
					});
				},
			},
		};
	}

	private _convertCatalogFilesUpdate(update: CatalogFilesUpdated, filters?: ArticleFilter[]): PChangeCatalog {
		return {
			catalog: this._getCatalog(update.catalog, filters),
			items: update.items.map((item) => ({ articleId: itemRefConverter.toId(item.ref), status: item.status })),
		};
	}

	private _getCatalog(catalog: Catalog, filters?: ArticleFilter[]): PCatalog {
		return {
			getArticleById: (id) => {
				const item = catalog.findItemByItemRef(itemRefConverter.toItemRef(id));
				const itemParent = this._getCategory(item.parent, catalog);
				return this._getArticle(item as Article, itemParent, catalog);
			},
			getArticles: () =>
				catalog
					.getItems(filters)
					.map((i) =>
						this._getArticle(i as Article, this._getCategory(catalog.getRootCategory(), catalog), catalog),
					),
			getName: () => catalog.getName(),
			getPathname: () => catalog.getPathname(),
		};
	}

	private _getCategory(category: Category, catalog: Catalog): PCategory {
		const pCategory: PCategory = {
			rawMdContent: category.content,
			getPathname: () => catalog.getPathname(category),
			getProp: (prop) => {
				return category.props[prop];
			},
			getHtmlContent: () =>
				category.parsedContent?.htmlValue
					? Promise.resolve(category.parsedContent.htmlValue)
					: this._htmlParser.parseToHtml(catalog, category),
			id: itemRefConverter.toId(category.ref),
			articles: null,
			parent: category.parent ? this._getCategory(category.parent, catalog) : null,
			type: ArticleType.category,
		};

		return pCategory;
	}

	private _getArticle(article: Article, parent: PCategory, catalog: Catalog): PArticle {
		return {
			rawMdContent: article.content,
			getProp: (prop) => {
				return article.props[prop];
			},
			getHtmlContent: () =>
				article.parsedContent?.htmlValue
					? Promise.resolve(article.parsedContent.htmlValue)
					: this._htmlParser.parseToHtml(catalog, article),
			getPathname: () => catalog.getPathname(article),
			id: itemRefConverter.toId(article.ref),
			parent,
			type: ArticleType.article,
		};
	}
}
