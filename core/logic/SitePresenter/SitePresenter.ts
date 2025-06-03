import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import LastVisited from "@core/SitePresenter/LastVisited";
import type { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { RefInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { catalogHasItems, isLanguageCategory, resolveRootCategory } from "@ext/localization/core/catalogExt";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import TabsTags from "@ext/markdown/elements/tabs/model/TabsTags";
import NavigationEventHandlers from "@ext/navigation/events/NavigationEventHandlers";
import getAllCatalogProperties from "@ext/properties/logic/getAllCatalogProps";
import { Property, PropertyValue } from "@ext/properties/models";
import RuleProvider from "@ext/rules/RuleProvider";
import { TemplateField } from "@ext/templates/models/types";
import type { Workspace } from "@ext/workspace/Workspace";
import type { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import htmlToText from "html-to-text";
import UiLanguage, { ContentLanguage, resolveLanguage } from "../../extensions/localization/core/model/Language";
import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import { CatalogLink, ItemLink, TitledLink } from "../../extensions/navigation/NavigationLinks";
import { TocItem } from "../../extensions/navigation/article/logic/createTocItems";
import Navigation from "../../extensions/navigation/catalog/main/logic/Navigation";
import UserInfo from "../../extensions/security/logic/User/UserInfo";
import Context from "../Context/Context";
import Path from "../FileProvider/Path/Path";
import { Article } from "../FileStructue/Article/Article";
import parseContent from "../FileStructue/Article/parseContent";
import { ArticleFilter, Catalog, ItemFilter } from "../FileStructue/Catalog/Catalog";
import type { ReadonlyBaseCatalog, ReadonlyCatalog } from "../FileStructue/Catalog/ReadonlyCatalog";

export type ClientCatalogProps = {
	name: string;
	title: string;
	docroot: string;
	repositoryName: string;
	contactEmail: string;
	language: ContentLanguage;
	supportedLanguages: ContentLanguage[];
	properties?: Property[];
	tabsTags?: TabsTags;
	sourceName: string;
	userInfo: UserInfo;
	link: CatalogLink;
	relatedLinks?: TitledLink[];
	versions?: string[];
	resolvedVersions?: RefInfo[];
	resolvedVersion?: RefInfo;
	syntax?: Syntax;
	docrootIsNoneExsistent?: boolean;
	notFound: boolean;
};

export type ClientArticleProps = {
	logicPath: string;
	pathname: string;
	fileName: string;
	ref: ClientItemRef;
	title: string;
	description: string;
	tocItems: TocItem[];
	errorCode: number;
	welcome?: boolean;
	status?: FileStatus;
	properties?: PropertyValue[];
	template?: string;
	fields?: TemplateField[];
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

export type GetArticlePageDataOptions = {
	editableContent?: boolean;
	markdown?: boolean;
};

export type ArticlePageData = {
	markdown?: string;
	articleContentRender?: string;
	articleContentEdit?: string;
	articleProps: ClientArticleProps;
	catalogProps: ClientCatalogProps;
	itemLinks: ItemLink[];
	rootRef?: ClientItemRef;
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
		new NavigationEventHandlers(this._nav, this._context, this._customArticlePresenter).mount();
		this._filters = new RuleProvider(this._context, this._nav, this._customArticlePresenter).getItemFilters();
	}

	async getHomePageData(workspace: WorkspaceConfig): Promise<HomePageData> {
		const groups = workspace?.groups && Object.keys(workspace.groups);
		const catalogLinks: CatalogsLinks = {};
		const catalogs = this._workspace.getAllCatalogs();

		groups?.forEach((group) => {
			catalogLinks[group] = {
				catalogLinks: [],
				style: workspace?.groups?.[group]?.style ?? "small",
				title: workspace?.groups?.[group]?.title ?? "",
			};
		});

		catalogLinks.other = { catalogLinks: [], style: "small", title: "other" };
		catalogLinks.null = { catalogLinks: [], style: "small", title: null };

		const lastVisited = new LastVisited(this._context, workspace.name);
		lastVisited.retain(Array.from(catalogs.keys()));
		(
			await this._nav.getCatalogsLink(
				Array.from(catalogs.values()),
				lastVisited,
				(c) =>
					!c.props.language ||
					!this._context.contentLanguage ||
					c.props.language == this._context.contentLanguage,
			)
		).forEach((cLink) => {
			let group: string = groups ? cLink.group : null;
			if (groups && !groups.includes(cLink.group)) group = "other";
			catalogLinks[group].catalogLinks.push(cLink);
		});

		return { catalogLinks };
	}

	async getArticlePageData(
		article: Article,
		catalog: ReadonlyCatalog,
		{ editableContent, markdown }: GetArticlePageDataOptions = {},
	): Promise<ArticlePageData> {
		await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);

		const itemLinks = catalog ? await this._nav.getCatalogNav(catalog, article.ref.path.value) : [];

		const { edit, render } = await article.parsedContent.read((p) => {
			return {
				render: JSON.stringify(p.renderTree),
				edit: editableContent ? JSON.stringify(getArticleWithTitle(article.props.title, p.editTree)) : null,
			};
		});

		return {
			markdown: markdown ? article.content : null,
			articleContentRender: render,
			articleContentEdit: edit,
			articleProps: await this.serializeArticleProps(article, await catalog?.getPathname(article)),
			catalogProps: await this.serializeCatalogProps(catalog),
			rootRef: catalog ? await this._nav.getRootItemLink(catalog) : null,
			itemLinks,
		};
	}

	async getArticlePageDataByPath(
		path: string[],
		pathname?: string,
		options: GetArticlePageDataOptions = {},
	): Promise<ArticlePageData> {
		const data = await this.getArticleByPathOfCatalog(path);
		if (!data.catalog) return null;
		if (!data.article) {
			data.article = catalogHasItems(data.catalog, this._context.contentLanguage || data.catalog.props.language)
				? this._customArticlePresenter.getArticle("Article404", { pathname })
				: this._customArticlePresenter.getArticle("welcome");
		}
		return await this.getArticlePageData(data.article, data.catalog, options);
	}

	async getCatalogNav(catalog: ReadonlyCatalog, currentItemPath: string): Promise<ItemLink[]> {
		return (await this._nav.getCatalogNav(catalog, currentItemPath)) ?? [];
	}

	async getHtml(path: string[], ApiRequestUrl?: string): Promise<string> {
		const { article, catalog } = await this.getArticleByPathOfCatalog(path);
		if (!article || !catalog) return null;
		const parsedContext = await this._parserContextFactory.fromArticle(
			article,
			catalog,
			this._getLang(catalog),
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
			htmlToText.fromString(await article.parsedContent.read((p) => p.htmlValue), {
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

	async parseAllItems(catalog: ReadonlyCatalog): Promise<ReadonlyCatalog> {
		for (const article of catalog.getContentItems()) {
			try {
				await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
			} catch (e) {
				// logger.logError(e);
			}
		}
		return catalog;
	}

	async serializeArticleProps(article: Article, pathname: string): Promise<ClientArticleProps> {
		return {
			pathname,
			logicPath: article.logicPath,
			fileName: article.getFileName(),
			ref: {
				path: article.ref.path.value,
				storageId: article.ref.storageId,
			},
			title: article.getTitle(),
			description: article.props["description"] ?? "",
			tocItems: (await article?.parsedContent.read((p) => p?.tocItems)) ?? [],
			properties: article.props.properties ?? [],
			errorCode: article.errorCode ?? null,
			welcome: article.props.welcome ?? null,
			template: article.props.template ?? null,
			fields: article.props.fields ?? [],
		};
	}

	async serializeCatalogProps(catalog: ReadonlyBaseCatalog): Promise<ClientCatalogProps> {
		if (!catalog) {
			return {
				notFound: true,
				relatedLinks: null,
				link: null,
				contactEmail: null,
				tabsTags: null,
				name: null,
				title: "",
				repositoryName: null,
				sourceName: null,
				userInfo: null,
				language: ContentLanguage[resolveLanguage()],
				supportedLanguages: [ContentLanguage[resolveLanguage()]],
				properties: [],
				docroot: "",
			};
		}

		const storage = catalog.repo.storage;

		return {
			notFound: false,
			link: await this._nav.getCatalogLink(
				catalog,
				new LastVisited(this._context, (await this._workspace.config()).name),
			),
			relatedLinks: await this._nav.getRelatedLinks(catalog),
			contactEmail: catalog.props.contactEmail ?? null,
			tabsTags: catalog.props.tabsTags ?? null,
			name: catalog.name ?? null,
			title: catalog.props.title ?? "",
			language: catalog.props.language,
			properties: getAllCatalogProperties(catalog),
			repositoryName: catalog.name,
			sourceName: (await storage?.getSourceName()) ?? null,
			userInfo: this._grp.getSourceUserInfo(this._context, await storage?.getSourceName()),
			docroot: catalog.getRelativeRootCategoryPath()?.value,
			supportedLanguages: Array.from(catalog.props.supportedLanguages || []),
			versions: catalog.props.versions,
			resolvedVersion: catalog.props.resolvedVersion,
			resolvedVersions: catalog.props.resolvedVersions,
			syntax: catalog.props.syntax,
			docrootIsNoneExsistent: catalog.props.docrootIsNoneExistent,
		};
	}

	async getArticleByPathOfCatalog(
		path: string[],
		filters = this._filters,
	): Promise<{ article: Article; catalog: ContextualCatalog }> {
		const catalog = await this._workspace.getCatalog(path[0], this._context);
		if (!catalog) return { article: null, catalog: null };
		const itemLogicPath = Path.join(...path);
		const root = resolveRootCategory(
			catalog,
			catalog.props,
			this._context.contentLanguage || catalog.props.language,
		);
		let article = catalog.findArticle(
			itemLogicPath,
			!root.parent ? [(i) => !isLanguageCategory(catalog, i), ...filters] : filters,
			root,
		);

		// ! Hack, because we need to 😢
		// ? Checks if the found category is a language category, then redirects user to first child, or to any other first in route
		if (isLanguageCategory(catalog, article)) {
			if (this._context.contentLanguage || catalog.props.language != this._context.contentLanguage)
				article = (article as Category).items[0] as Article;
			else article = catalog.getRootCategory().items.find((i) => !isLanguageCategory(catalog, i)) as Article;
		}

		return { article, catalog };
	}

	private _isLogged(): boolean {
		return this._context.user?.isLogged ?? false;
	}

	private _getLang(catalog: ReadonlyCatalog): UiLanguage {
		return convertContentToUiLanguage(this._context.contentLanguage || catalog.props.language);
	}
}
