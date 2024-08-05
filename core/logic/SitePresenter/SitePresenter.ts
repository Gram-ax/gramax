import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import LastVisited from "@core/SitePresenter/LastVisited";
import GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import TabsTags from "@ext/markdown/elements/tabs/model/TabsTags";
import RuleProvider from "@ext/rules/RuleProvider";
import type { Workspace } from "@ext/workspace/Workspace";
import type { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import htmlToText from "html-to-text";
import Language from "../../extensions/localization/core/model/Language";
import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import { CatalogLink, ItemLink, TitledLink } from "../../extensions/navigation/NavigationLinks";
import { TocItem } from "../../extensions/navigation/article/logic/createTocItems";
import Navigation from "../../extensions/navigation/catalog/main/logic/Navigation";
import UserInfo from "../../extensions/security/logic/User/UserInfo2";
import Context from "../Context/Context";
import Path from "../FileProvider/Path/Path";
import { Article } from "../FileStructue/Article/Article";
import parseContent from "../FileStructue/Article/parseContent";
import { ArticleFilter, Catalog, ItemFilter } from "../FileStructue/Catalog/Catalog";
import { Item } from "../FileStructue/Item/Item";
import getArticleAsString from "@ext/markdown/elements/article/edit/logic/getArticleAsString";

export type ClientCatalogProps = {
	name: string;
	title: string;
	docroot: string;
	repositoryName: string;
	contactEmail: string;
	tabsTags?: TabsTags;
	sourceName: string;
	userInfo: UserInfo;
	link: CatalogLink;
	readOnly?: boolean;
	relatedLinks?: TitledLink[];
};

export type ClientArticleProps = {
	logicPath: string;
	pathname: string;
	fileName: string;
	ref: ClientItemRef;
	title: string;
	description: string;
	tags: string[];
	tocItems: TocItem[];
	errorCode: number;
	welcome?: boolean;
};

export type ClientItemRef = {
	path: string;
	storageId: string;
};

export type GroupData = {
	catalogLinks: CatalogLink[];
	style: "small" | "big";
	title: string;
};

export type CatalogsLinks = Record<string, GroupData>;

export type HomePageData = {
	catalogLinks: CatalogsLinks;
};

export type ArticlePageData = {
	articleContentEdit: string;
	articleContentRender: string;
	articleProps: ClientArticleProps;
	catalogProps: ClientCatalogProps;
	itemLinks: ItemLink[];
};

export type OpenGraphData = {
	title: string;
	description: string;
};

export default class SitePresenter {
	private _filters: ItemFilter[];

	constructor(
		private _nav: Navigation,
		private _workspace: Workspace,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _grp: GitRepositoryProvider,
		private _customArticlePresenter: CustomArticlePresenter,
		private _context: Context,
	) {
		const rp = new RuleProvider(_context, _customArticlePresenter);
		rp.getNavRules().forEach((r) => this._nav.addRules(r));
		this._filters = rp.getItemFilters();
	}

	async getHomePageData(workspace: WorkspaceConfig): Promise<HomePageData> {
		const groups = workspace?.groups && Object.keys(workspace.groups);
		const catalogLinks: CatalogsLinks = {};
		const catalogs = this._workspace.getCatalogEntries();

		groups?.forEach((group) => {
			catalogLinks[group] = {
				catalogLinks: [],
				style: workspace?.groups?.[group]?.style ?? "small",
				title: workspace?.groups?.[group]?.title ?? "",
			};
		});
		catalogLinks.other = { catalogLinks: [], style: "small", title: "other" };
		catalogLinks.null = { catalogLinks: [], style: "small", title: null };

		const lastVisited = new LastVisited(this._context);
		lastVisited.retain(Array.from(catalogs.keys()));
		(await this._nav.getCatalogsLink(catalogs, lastVisited)).forEach((cLink) => {
			let group: string = groups ? cLink.group : null;
			if (groups && !groups.includes(cLink.group)) group = "other";
			catalogLinks[group].catalogLinks.push(cLink);
		});

		return { catalogLinks };
	}

	async getArticlePageData(article: Article, catalog: Catalog): Promise<ArticlePageData> {
		await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);

		return {
			articleContentEdit: getArticleAsString(article.props.title, article.parsedContent.editTree),
			articleContentRender: JSON.stringify(article.parsedContent.renderTree),
			articleProps: this.serializeArticleProps(article, await catalog?.getPathname(article)),
			catalogProps: await this.serializeCatalogProps(catalog),
			itemLinks: catalog ? await this._nav.getCatalogNav(catalog, article.logicPath) : [],
		};
	}

	async getArticlePageDataByPath(path: string[], pathname?: string): Promise<ArticlePageData> {
		const data = await this.getArticleByPathOfCatalog(path);
		if (!data.catalog) return null;
		if (!data.article) {
			data.article = data.catalog.hasItems()
				? this._customArticlePresenter.getArticle("Article404", { pathname })
				: this._customArticlePresenter.getArticle("welcome");
			data.article.props.lang = this._context.lang;
		}
		return await this.getArticlePageData(data.article, data.catalog);
	}

	async getCatalogNav(catalog: Catalog, currentItemLogicPath: string): Promise<ItemLink[]> {
		return (await this._nav.getCatalogNav(catalog, currentItemLogicPath)) ?? [];
	}

	async getHtml(path: string[], ApiRequestUrl?: string): Promise<string> {
		const { article, catalog } = await this.getArticleByPathOfCatalog(path);
		if (!article || !catalog) return null;
		const parsedContext = this._parserContextFactory.fromArticle(
			article,
			catalog,
			this._getLang(),
			this._isLogged(),
		);
		return await this._parser.parseToHtml(article.content, parsedContext, ApiRequestUrl);
	}

	getFilters(): ArticleFilter[] {
		return this._filters;
	}

	async getOpenGraphData(path: string[], readyArticle?: Article, readyCatalog?: Catalog): Promise<OpenGraphData> {
		const { article, catalog } = readyArticle
			? { article: readyArticle, catalog: readyCatalog }
			: await this.getArticleByPathOfCatalog(path, [this._filters[1], this._filters[2]]);

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
			title: article.props.title ?? "",
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

	serializeArticleProps(article: Article, pathname: string): ClientArticleProps {
		const tags: Set<string> = new Set<string>();
		let currentItem: Item = article;
		while (currentItem) {
			if (currentItem.props["tags"]) {
				for (const prop of currentItem.props["tags"]) tags.add(prop);
			}
			currentItem = currentItem.parent;
		}
		return {
			pathname,
			logicPath: article.logicPath,
			fileName: article.getFileName(),
			ref: {
				path: article.ref.path.value,
				storageId: article.ref.storageId,
			},
			title: article.props.title ?? "",
			description: article.props["description"] ?? "",
			tags: Array.from(tags.values()),
			tocItems: article?.parsedContent?.tocItems ?? [],
			errorCode: article.errorCode ?? null,
			welcome: article.props.welcome ?? null,
		};
	}

	async serializeCatalogProps(catalog: Catalog): Promise<ClientCatalogProps> {
		if (!catalog) {
			return {
				relatedLinks: null,
				link: null,
				contactEmail: null,
				tabsTags: null,
				name: null,
				title: "",
				repositoryName: null,
				readOnly: false,
				sourceName: null,
				userInfo: null,
				docroot: "",
			};
		}

		const storage = catalog.repo.storage;

		return {
			link: await this._nav.getCatalogLink(catalog, new LastVisited(this._context)),
			relatedLinks: this._nav.getRelatedLinks(catalog),
			contactEmail: catalog.props.contactEmail ?? null,
			tabsTags: catalog.props.tabsTags ?? null,
			name: catalog.getName() ?? null,
			title: catalog.props.title ?? "",
			readOnly: catalog.props.readOnly ?? false,
			repositoryName: catalog.getName(),
			sourceName: (await storage?.getSourceName()) ?? null,
			userInfo: this._grp.getSourceUserInfo(this._context.cookie, await storage?.getSourceName()),
			docroot: catalog.getRelativeRootCategoryPath()?.value,
		};
	}

	async getArticleByPathOfCatalog(
		path: string[],
		filters = this._filters,
	): Promise<{ article: Article; catalog: Catalog }> {
		const catalogName = path[0];
		const catalog = await this._workspace.getCatalog(catalogName);
		if (!catalog) return { article: null, catalog: null };
		const itemLogicPath = Path.join(...path);
		const article = catalog.findArticle(itemLogicPath, filters);
		return { article, catalog };
	}

	private _isLogged(): boolean {
		return this._context.user?.isLogged ?? false;
	}

	private _getLang(): Language {
		return this._context.lang;
	}
}
