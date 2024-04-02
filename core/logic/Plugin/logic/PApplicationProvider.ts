import { Article } from "@core/FileStructue/Article/Article";
import { Catalog, ChangeCatalog } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import Library from "@core/Library/Library";
import { ArticleType, PApplication, PArticle, PCatalog, PCategory, PChangeCatalog } from "@core/Plugin";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import itemRefConverter from "@core/Plugin/logic/utils/itemRefConverter";
import HtmlParser from "@ext/html/HtmlParser";

export default class PApplicationProvider {
	constructor(private _lib: Library, private _htmlParser: HtmlParser, private _pluginsCache: PluginsCache) {}

	async getApp(pluginName: string): Promise<PApplication> {
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
					return this._getCatalog(await this._lib.getCatalog(name));
				},
				getAll: async () => {
					const res: PCatalog[] = [];
					for (const entry of this._lib.getCatalogEntries().values()) {
						res.push(this._getCatalog(await entry.load()));
					}
					return res;
				},
				onUpdate: (callback) => {
					this._lib.addOnChangeRule((changeCatalogs) => {
						void callback(changeCatalogs.map((c) => this._getChangeCatalog(c)));
					});
				},
			},
		};
	}

	private _getChangeCatalog(changeCatalog: ChangeCatalog): PChangeCatalog {
		return {
			catalog: this._getCatalog(changeCatalog.catalog),
			articleId: itemRefConverter.toId(changeCatalog.itemRef),
			type: changeCatalog.type,
		};
	}

	private _getCatalog(catalog: Catalog): PCatalog {
		return {
			getArticleById: (id) => {
				const item = catalog.findItemByItemRef(itemRefConverter.toItemRef(id));
				const itemParent = this._getCategory(item.parent, catalog);
				return this._getArticle(item as Article, itemParent, catalog);
			},
			getArticles: () =>
				catalog
					.getItems()
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
		pCategory.articles = category.getItems().map((i) => this._getArticle(i as Article, pCategory, catalog));

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
