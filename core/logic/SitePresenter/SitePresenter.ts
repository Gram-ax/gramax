import GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import htmlToText from "html-to-text";
import Language from "../../extensions/localization/core/model/Language";
import { localizationProps } from "../../extensions/localization/core/rules/FSLocalizationRules";
import LocalizationRules from "../../extensions/localization/core/rules/LocalizationRules";
import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import { CatalogLink, ItemLink, TitledLink } from "../../extensions/navigation/NavigationLinks";
import { TocItem } from "../../extensions/navigation/article/logic/createTocItems";
import Navigation from "../../extensions/navigation/catalog/main/logic/Navigation";
import Searcher from "../../extensions/search/Searcher";
import SecurityRules from "../../extensions/security/logic/SecurityRules";
import UserInfo from "../../extensions/security/logic/User/UserInfo2";
import Context from "../Context/Context";
import Path from "../FileProvider/Path/Path";
import { Article } from "../FileStructue/Article/Article";
import parseContent from "../FileStructue/Article/parseContent";
import { ArticleFilter, Catalog } from "../FileStructue/Catalog/Catalog";
import { Item, ItemRef } from "../FileStructue/Item/Item";
import HiddenRule from "../FileStructue/Rules/HiddenRules/HiddenRule";
import ShowHomePageRule from "../FileStructue/Rules/ShowHomePageRule/ShowHomePageRule";
import Library from "../Library/Library";
import ErrorArticlePresenter from "./ErrorArticlePresenter";

export default class SitePresenter {
	private _filters: ArticleFilter[];

	constructor(
		private _nav: Navigation,
		private _lib: Library,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _sm: Searcher,
		private _grp: GitRepositoryProvider,
		private _errorArticlesPresenter: ErrorArticlePresenter,
		private _context: Context,
	) {
		const shr = new ShowHomePageRule();
		const hr = new HiddenRule(_errorArticlesPresenter);
		const lr = new LocalizationRules(_context.lang, _errorArticlesPresenter);
		const sr = new SecurityRules(_context.user, _errorArticlesPresenter);

		this._nav.addRules({ itemFilter: hr.getItemRule() });
		this._nav.addRules({ catalogFilter: shr.getNavCatalogRule() });
		this._nav.addRules({ catalogFilter: lr.getNavCatalogRule(), itemFilter: lr.getNavItemRule() });
		this._nav.addRules({
			catalogFilter: sr.getNavCatalogRule(),
			itemFilter: sr.getNavItemRule(),
			relatedLinkFilter: sr.getNavRelationRule(),
		});

		this._filters = [sr.getFilterRule(), hr.getFilterRule(), lr.getFilterRule()];
	}

	async getSearchData(query: string, catalogName: string) {
		return await this._sm.search(query, catalogName, await this._getCatalogItemRefs(catalogName));
	}

	async getAllSearchData(query: string) {
		const catalogs = this._nav.getCatalogsLink(this._lib.getCatalogEntries()).map((l) => l.name);
		const catalogsItemRefs = {};
		await Promise.all(catalogs.map(async (c) => (catalogsItemRefs[c] = await this._getCatalogItemRefs(c))));
		return await this._sm.searchAll(query, catalogsItemRefs);
	}

	async getData(path: string[]): Promise<ArticleData> {
		const data = await this.getArticleCatalog(path);
		if (!data.catalog) return null;
		if (!data.article) {
			data.article = this._errorArticlesPresenter.getErrorArticle("404");
			data.article.props[localizationProps.language] = this._context.lang;
		}
		return await this.getArticleData(data.article, data.catalog);
	}

	async getArticleData(article: Article, catalog: Catalog): Promise<ArticleData> {
		await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
		return {
			articleContentEdit: JSON.stringify(article.parsedContent.editTree),
			articleContentRender: JSON.stringify(article.parsedContent.renderTree),
			articleProps: this.getArticleProps(article),
			catalogProps: await this.getCatalogProps(catalog),
			itemLinks: catalog ? await this._nav.getCatalogNav(catalog, article.logicPath) : [],
		};
	}

	async getCatalogNav(catalog: Catalog, currentItemLogicPath: string): Promise<ItemLink[]> {
		return (await this._nav.getCatalogNav(catalog, currentItemLogicPath)) ?? [];
	}

	async getHtml(path: string[], ApiRequestUrl?: string): Promise<string> {
		const { article, catalog } = await this.getArticleCatalog(path);
		if (!article || !catalog) return null;
		const parsedContext = this._parserContextFactory.fromArticle(
			article,
			catalog,
			this._getLang(),
			this._isLogged(),
		);
		return await this._parser.parseToHtml(article.content, parsedContext, ApiRequestUrl);
	}

	getHomePageData(): HomePageData {
		const catalogLinks: { [group: string]: CatalogLink[] } = {};
		const catalogs = this._lib.getCatalogEntries();
		this._nav.getCatalogsLink(catalogs).forEach((link) => {
			if (catalogLinks[link.group] === undefined) catalogLinks[link.group] = [];
			catalogLinks[link.group].push(link);
		});
		return {
			catalogLinks,
		};
	}

	getFilters(): ArticleFilter[] {
		return this._filters;
	}

	async getOpenGraphData(path: string[], readyArticle?: Article, readyCatalog?: Catalog): Promise<OpenGraphData> {
		const { article, catalog } = readyArticle
			? { article: readyArticle, catalog: readyCatalog }
			: await this.getArticleCatalog(path, [this._filters[1], this._filters[2]]);

		if (!article) return null;
		if (!article.parsedContent)
			await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
		let description =
			article.props["summary"] ??
			htmlToText.fromString(article.parsedContent.htmlValue, {
				ignoreHref: true,
				ignoreImage: true,
				selectors: ["h1", "h2", "h3", "h4"].map((v) => ({ selector: v, options: { uppercase: false } })),
			});
		if (description.length > 150) description = description.slice(0, 150) + "...";
		return {
			title: article.props["title"] ?? "",
			description,
		};
	}

	async parseAllItems(catalog: Catalog): Promise<Catalog> {
		for (const article of catalog.getContentItems()) {
			try {
				await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
			} catch (e) {
				// logger.logError(e);
			}
		}
		return catalog;
	}

	getArticleProps(article: Article): ArticleProps {
		const tags: Set<string> = new Set<string>();
		let currentItem: Item = article;
		while (currentItem) {
			if (currentItem.props["tags"]) {
				for (const prop of currentItem.props["tags"]) tags.add(prop);
			}
			currentItem = currentItem.parent;
		}
		return {
			path: article.logicPath,
			fileName: article.getFileName(),
			ref: {
				path: article.ref.path.value,
				storageId: article.ref.storageId,
			},
			title: article.props["title"] ?? "",
			description: article.props["description"] ?? "",
			tags: Array.from(tags.values()),
			tocItems: article?.parsedContent?.tocItems ?? [],
			errorCode: article.errorCode ?? null,
		};
	}

	async getCatalogProps(catalog: Catalog): Promise<CatalogProps> {
		if (!catalog) {
			return {
				relatedLinks: null,
				link: null,
				contactEmail: null,
				name: null,
				title: "",
				repositoryName: null,
				readOnly: false,
				sourceName: null,
				userInfo: null,
				private: [],
			};
		}

		const storage = catalog.repo.storage;

		return {
			link: this._nav.getCatalogLink(catalog),
			relatedLinks: this._nav.getRelatedLinks(catalog),
			contactEmail: catalog.getProp("contactEmail") ?? null,
			name: catalog.getName() ?? null,
			title: catalog.getProp("title") ?? "",
			readOnly: catalog.getProp("readOnly") ?? false,
			repositoryName: catalog.getName(),
			sourceName: (await storage?.getSourceName()) ?? null,
			userInfo: this._grp.getSourceUserInfo(this._context.cookie, await storage?.getSourceName()),
			private: catalog.getProp("private") ?? [],
		};
	}

	async getArticleCatalog(path: string[], filters = this._filters): Promise<{ article: Article; catalog: Catalog }> {
		const catalogName = path[0];
		const catalog = await this._lib.getCatalog(catalogName);
		if (!catalog) return { article: null, catalog: null };
		const itemLogicPath = Path.join(...path);
		const article = catalog.findAnyArticle(itemLogicPath, filters);
		return { article, catalog };
	}

	private _isLogged(): boolean {
		return this._context.user?.isLogged ?? false;
	}

	private _getLang(): Language {
		return this._context.lang;
	}

	private async _getCatalogItemRefs(catalogName: string): Promise<ItemRef[]> {
		const catalog = await this._lib.getCatalog(catalogName);
		return catalog
			?.getContentItems()
			.filter((a) => this._filters.every((f) => f(a, catalogName)))
			.map((a) => a.ref);
	}
}

export interface ArticleData {
	articleContentEdit: string;
	articleContentRender: string;
	articleProps: ArticleProps;
	catalogProps: CatalogProps;
	itemLinks: ItemLink[];
}

export interface HomePageData {
	catalogLinks: { [group: string]: CatalogLink[] };
}

export interface ArticleProps {
	path: string;
	fileName: string;
	ref: ItemRefProps;
	title: string;
	description: string;
	tags: string[];
	tocItems: TocItem[];
	errorCode: number;
}

export interface ItemRefProps {
	path: string;
	storageId: string;
}

export interface CatalogProps {
	relatedLinks: TitledLink[];
	repositoryName: string;
	contactEmail: string;
	sourceName: string;
	readOnly?: boolean;
	userInfo: UserInfo;
	link: CatalogLink;
	private: string[];
	title: string;
	name: string;
}

export interface OpenGraphData {
	title: string;
	description: string;
}
