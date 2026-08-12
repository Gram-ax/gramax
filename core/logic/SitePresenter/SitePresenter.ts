import { getExecutingEnvironment } from "@app/resolveModule/env";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import LastVisited from "@core/SitePresenter/LastVisited";
import homeSections from "@core/utils/homeSections";
import { isEditorInstance } from "@core-ui/utils/isEditorInstance";
import CatalogViewRules from "@ext/catalog/views/logic/rules/CatalogViewRules";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import { getArticleDiffSideBarData } from "@ext/git/core/Diff/logic/utils/getArticleDiffSideBarData";
import type { RefInfo, TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import type GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { catalogHasItems, isLanguageCategory, resolveRootCategory } from "@ext/localization/core/catalogExt";
import { addEvent, Level, traced } from "@ext/loggers/opentelemetry";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { getStoredQuestionsByContent } from "@ext/markdown/elements/question/render/logic/getStoredQuestionsByContent";
import type { StoredQuestion } from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import extractPreviewFromEditTree from "@ext/markdown/elementsUtils/extractPreviewFromEditTree";
import NavigationEventHandlers from "@ext/navigation/events/NavigationEventHandlers";
import getAllCatalogProperties from "@ext/properties/logic/getAllCatalogProps";
import type { Property, PropertyID, PropertyValue } from "@ext/properties/models";
import type { QuizSettings } from "@ext/quiz/models/types";
import RuleProvider from "@ext/rules/RuleProvider";
import type { TemplateField } from "@ext/templates/models/types";
import { GitTreeScopeParser } from "@ext/versioning/GitTreeScopeParser";
import type { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { Workspace } from "@ext/workspace/Workspace";
import type { WorkspaceConfig, WorkspaceSection } from "@ext/workspace/WorkspaceConfig";
import { WorkspaceView } from "@ext/workspace/WorkspaceConfig";
import { ContentLanguage, resolveLanguage } from "../../extensions/localization/core/model/Language";
import type MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import type ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import type { TocItem } from "../../extensions/navigation/article/logic/createTocItems";
import type Navigation from "../../extensions/navigation/catalog/main/logic/Navigation";
import type { CatalogLink, ItemLink, TitledLink } from "../../extensions/navigation/NavigationLinks";
import type UserInfo from "../../extensions/security/logic/User/UserInfo";
import type Context from "../Context/Context";
import Path from "../FileProvider/Path/Path";
import type { Article } from "../FileStructue/Article/Article";
import parseContent from "../FileStructue/Article/parseContent";
import type { ArticleFilter, Catalog, ItemFilter } from "../FileStructue/Catalog/Catalog";
import type { ReadonlyCatalog } from "../FileStructue/Catalog/ReadonlyCatalog";
import type {
	ArticleDiffData,
	ArticlePageData,
	ArticlePageDataWithContent,
	ArticlePageOptions,
	EditArticlePageData,
	MarkdownArticlePageData,
	ReadonlyArticlePageData,
} from "./types/ArticlePage";

export type ClientCatalogProps = {
	name: string;
	title: string;
	docroot: string;
	repositoryName: string;
	repositoryError: Error;
	contactEmail: string;
	language: ContentLanguage;
	supportedLanguages: ContentLanguage[];
	properties?: Property[];
	sourceName: string;
	userInfo: UserInfo;
	link: CatalogLink;
	relatedLinks?: TitledLink[];
	versions?: string[];
	resolvedVersions?: RefInfo[];
	resolvedVersion?: RefInfo;
	syntax?: Syntax;
	notFound: boolean;
	resolvedView?: CatalogView;
	filterProperty?: PropertyID;
	logo?: string;
	logo_dark?: string;
	hasViews?: boolean;
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
	questions?: Record<string, StoredQuestion>;
	quiz?: QuizSettings;
	searchPhrases?: string[];
	aliases?: (string | { path: string; moved?: string })[];
	aliasedFrom?: string;
};

export type ClientItemRef = {
	path: string;
	storageId: string;
};

export type Section = {
	title: string;
	href: string;
	catalogLinks: CatalogLink[];
	icon?: string;
	view?: WorkspaceView;
	description?: string;
	sections?: Sections;
};

export type Sections = Record<string, Section>;

export type HomePageBreadcrumb = {
	title: string;
	href: string;
};

export type HomePageData = {
	section: Section;
	breadcrumb: HomePageBreadcrumb[];
	catalogsLinks: CatalogLink[];
	group?: string;
};

export type OpenGraphData = {
	title: string;
	description: string;
	pathname: string;
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
		private _isReadOnly: boolean,
	) {
		new NavigationEventHandlers(this._nav, this._context, this._customArticlePresenter).mount();
		this._filters = new RuleProvider(this._context, this._nav, this._customArticlePresenter).getItemFilters();

		this._nav.events.on("before-build-nav-tree", async ({ catalog }) => {
			await this._parseUntitledItems(catalog);
		});
	}

	async getHomePageData(workspace: WorkspaceConfig, path?: string): Promise<HomePageData> {
		const pathSections = homeSections.getHomePathSections(path);
		const sectionsInfo = workspace?.sections || workspace?.groups || {};

		const catalogs = this._workspace.getAllCatalogs();
		const lastVisited = new LastVisited(this._context, workspace.name);
		lastVisited.retain(Array.from(catalogs.keys()));

		const catalogsLinks = await this._nav.getCatalogsLink(
			Array.from(catalogs.values()),
			lastVisited,
			(c) =>
				!c.props.language ||
				!this._context.contentLanguage ||
				c.props.language === this._context.contentLanguage,
		);
		const { section, breadcrumb, group } = this._getSection(catalogsLinks, sectionsInfo, pathSections);

		return { section, catalogsLinks, breadcrumb, group: group ?? null };
	}

	async getArticlePageData(
		article: Article,
		catalog: ReadonlyCatalog,
		options?: ArticlePageOptions & { scopedCatalog?: ReadonlyCatalog },
	): Promise<ArticlePageData> {
		if (options?.mode !== "markdown") {
			await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
		}

		const articleProps = await this.serializeArticleProps(article, await catalog?.getPathname(article));
		const isReadOnly = this._isReadOnly || !!articleProps.errorCode;

		let categoryIsExists = true;
		if (article.type === ItemType.category) {
			categoryIsExists = await this._workspace.getFileProvider().exists(article.ref.path);
		}

		const isEditor = isEditorInstance();
		const diff: ArticleDiffData =
			options?.diff && isEditor && categoryIsExists
				? await this.getDiffArticlePage(article, catalog, options)
				: null;

		if (options?.mode === "markdown" && isEditor) {
			return { ...(await this._getMarkdownArticlePage(article, catalog)), diff };
		}

		if (isReadOnly) {
			return { ...(await this._getReadonlyArticlePage(article, catalog)), diff };
		}

		return { ...(await this._getEditArticlePage(article, catalog)), diff };
	}

	async getArticlePageDataByPath(path: string[], options?: ArticlePageOptions): Promise<ArticlePageData> {
		const data = await this.getArticleByPathOfCatalog(path);
		if (!data.catalog) return null;
		if (!data.article) {
			if (options?.diff) return null;
			data.article = catalogHasItems(data.catalog, this._context.contentLanguage || data.catalog.props.language)
				? this._customArticlePresenter.getArticle("Article404", { path: path.join("/") })
				: this._customArticlePresenter.getArticle("welcome");
		}
		const pageData = await this.getArticlePageData(data.article, data.catalog, options);
		if (pageData && data.aliasedFrom) pageData.articleProps.aliasedFrom = data.aliasedFrom;
		return pageData;
	}

	async getCatalogNav(catalog: ReadonlyCatalog, currentItemPath: string): Promise<ItemLink[]> {
		return (await this._nav.getCatalogNav(catalog, currentItemPath)) ?? [];
	}

	getFilters(): ArticleFilter[] {
		return this._filters;
	}

	async getOpenGraphData(article: Article, catalog?: ReadonlyCatalog): Promise<OpenGraphData> {
		if (getExecutingEnvironment() !== "next") return null;

		if (!article) return null;
		if (await article.parsedContent.isNull()) {
			await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
		}

		const editTree = await article.parsedContent.read((p) => p?.editTree);
		const preview = extractPreviewFromEditTree(editTree, 151);
		const description = preview.length > 150 ? `${preview.slice(0, 150)}...` : preview;
		const pathname = (await catalog?.getPathname(article))?.toString() ?? article?.logicPath ?? "";
		return {
			pathname,
			title: article.props.title ?? "",
			description,
		};
	}

	async parseAllItems(catalog: ReadonlyCatalog): Promise<ReadonlyCatalog> {
		for (const article of catalog.getContentItems()) {
			try {
				await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
			} catch {
				// logger.logError(e);
			}
		}
		return catalog;
	}

	async serializeArticleProps(article: Article, pathname: string): Promise<ClientArticleProps> {
		let storedQuestions: Record<string, StoredQuestion> = null;
		if (this._isReadOnly) {
			const renderTree = await article.parsedContent.read((p) => p?.renderTree);
			storedQuestions = getStoredQuestionsByContent(renderTree);
		}

		return {
			pathname: pathname ?? null,
			logicPath: article.logicPath ?? null,
			fileName: article.getFileName(),
			ref: {
				path: article.ref.path.value,
				storageId: article.ref.storageId,
			},
			title: article.getTitle(),
			description: article.props.description ?? "",
			tocItems: (await article?.parsedContent.read((p) => p?.tocItems)) ?? [],
			properties: article.props?.properties ?? [],
			errorCode: article.errorCode ?? null,
			welcome: article.props.welcome ?? null,
			template: article.props.template ?? null,
			fields: article.props.fields ?? [],
			questions: storedQuestions,
			quiz: article.props.quiz ?? null,
			searchPhrases: article.props.searchPhrases ?? [],
			aliases: article.props.aliases ?? [],
		};
	}

	async serializeCatalogProps(catalog: ReadonlyCatalog): Promise<ClientCatalogProps> {
		if (!catalog) {
			return {
				notFound: true,
				relatedLinks: null,
				link: null,
				contactEmail: null,
				name: null,
				title: "",
				repositoryName: null,
				repositoryError: null,
				sourceName: null,
				userInfo: null,
				language: ContentLanguage[resolveLanguage()],
				supportedLanguages: [ContentLanguage[resolveLanguage()]],
				properties: [],
				docroot: "",
				hasViews: false,
			};
		}

		const sourceName = (await catalog.repo?.storage?.getSourceName()) ?? null;
		let sourceUserInfo = null;
		try {
			sourceUserInfo = this._grp.getSourceUserInfo(this._context, sourceName);
		} catch {}

		const workspaceConfig = await this._workspace.config();
		const link = await this._nav.getCatalogLink(catalog, new LastVisited(this._context, workspaceConfig.name));
		const syntax = catalog.props.syntax;

		const hasViews = (await catalog.customProviders.viewProvider.getViews(0, 1)).length > 0;

		return {
			notFound: false,
			link,
			relatedLinks: await this._nav.getRelatedLinks(catalog),
			contactEmail: catalog.props.contactEmail ?? null,
			name: catalog.name ?? null,
			title: catalog.props.title ?? "",
			language: catalog.props.language,
			properties: getAllCatalogProperties(catalog) ?? [],
			repositoryName: catalog.name,
			repositoryError: catalog.repo instanceof BrokenRepository ? catalog.repo.error : null,
			sourceName,
			userInfo: sourceUserInfo,
			docroot: catalog.getRelativeRootCategoryPath()?.value,
			supportedLanguages: Array.from(catalog.props.supportedLanguages || []),
			versions: catalog.props.versions ?? null,
			filterProperty: catalog.props.filterProperty ?? null,
			resolvedVersion: catalog.props.resolvedVersion ?? null,
			resolvedView: catalog.props.resolvedView ?? null,
			resolvedVersions: catalog.props.resolvedVersions ?? null,
			syntax: syntax?.toUpperCase() === Syntax.xml ? Syntax.xml : (syntax ?? null),
			logo: catalog.props.logo ?? null,
			logo_dark: catalog.props.logo_dark ?? null,
			hasViews,
		};
	}

	async getArticleByPathOfCatalog(
		path: string[],
		filters = this._filters,
	): Promise<{ article: Article; catalog: ContextualCatalog; aliasedFrom?: string }> {
		const catalog = await this._workspace.getCatalog(path[0], this._context);
		if (!catalog) return { article: null, catalog: null };
		const itemLogicPath = Path.join(...path);
		const root =
			resolveRootCategory(catalog, catalog.props, this._context.contentLanguage || catalog.props.language) ??
			catalog.getRootCategory();

		const viewFilter = new CatalogViewRules(catalog).getItemFilter();
		const finalFilters = !root.parent
			? [(i) => !isLanguageCategory(catalog, i), ...filters, viewFilter]
			: [...filters, viewFilter];
		let article = catalog.findArticle(itemLogicPath, finalFilters, root);

		// Some callers only know the item's file path (articleProps.ref.path, e.g.
		// "notes/keep.md") — ArticleUpdaterService and every refresh flow built on it.
		// Logic paths never carry an extension, so fall back to an item-path lookup.
		if (!article) {
			const byItemPath = catalog.findItemByItemPath<Article>(new Path(itemLogicPath));
			if (byItemPath && finalFilters.every((f) => f(byItemPath, catalog))) article = byItemPath;
		}

		let aliasedFrom: string;
		if (!article) {
			const byAlias = catalog.aliases.findArticle(itemLogicPath, finalFilters, root);
			if (byAlias) {
				addEvent("alias-resolved", Level.Internal, { from: itemLogicPath, to: byAlias.logicPath });
				article = byAlias;
				aliasedFrom = itemLogicPath;
			}
		}

		// ! Hack, because we need to 😢
		// ? Checks if the found category is a language category, then redirects user to first child, or to any other first in route
		if (isLanguageCategory(catalog, article)) {
			if (this._context.contentLanguage || catalog.props.language !== this._context.contentLanguage)
				article = (article as Category).items[0] as Article;
			else article = catalog.getRootCategory().items.find((i) => !isLanguageCategory(catalog, i)) as Article;
		}

		return { article, catalog, aliasedFrom };
	}

	async getDiffArticlePage(
		article: Article,
		catalog: ReadonlyCatalog,
		options?: { scope?: string; oldScope?: string; scopedCatalog?: ReadonlyCatalog },
	): Promise<ArticleDiffData> {
		const scopedCatalog = options?.scopedCatalog ?? catalog;
		const isDeleted = !!options?.scopedCatalog;

		if (isDeleted) {
			await parseContent(article, scopedCatalog, this._context, this._parser, this._parserContextFactory);
		}

		const pathname = await catalog?.getPathname(article);
		const logicPath = article.logicPath;

		const sideBarData = await getArticleDiffSideBarData({
			article,
			catalog,
			scopedCatalog,
			isDeleted,
			pathname,
			logicPath,
			scope: options?.scope,
			oldScope: options?.oldScope,
		});
		if (!sideBarData) return;

		const scope: TreeReadScope = GitTreeScopeParser.parse(options?.scope) ?? null;
		const oldScope: TreeReadScope = GitTreeScopeParser.parse(options?.oldScope) ?? "HEAD";

		return { sideBarData, scope, oldScope };
	}

	getRedirectOnDelete(catalog: Catalog, articlePath: Path) {
		const item = catalog.findItemByItemPath(articlePath);
		return catalog.getPathname(item.parent);
	}

	private async _parseUntitledItems(catalog: ReadonlyCatalog) {
		await traced(
			`${this.constructor.name}._parseUntitledItems`,
			{ level: Level.Internal, args: [catalog.name] },
			async () => {
				const untitled = catalog.getContentItems().filter((a) => !a.props.title);
				addEvent("untitled-items", Level.Full, { count: untitled.length });
				await untitled.forEachAsync(async (article) => {
					try {
						await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
					} catch {}
				});
			},
		);
	}

	private _getSection(
		catalogLinks: CatalogLink[],
		sectionsInfo: Record<string, WorkspaceSection>,
		pathSections: string[],
	): {
		section: Section;
		breadcrumb: HomePageBreadcrumb[];
		group?: string;
	} {
		const addedCatalogLinks: Set<CatalogLink> = new Set();
		const catalogLinksByName = new Map(catalogLinks.map((cLink) => [cLink.name, cLink]));

		const getSections = (
			level: number,
			sectionsInfo: Record<string, WorkspaceSection>,
			parentSectionKeys: string[] = [],
		) => {
			const sections: Sections = {};

			for (const sectionName of Object.keys(sectionsInfo)) {
				const sectionInfo = sectionsInfo[sectionName];
				const findCatalogLinks = [];
				const sectionKeys = [...parentSectionKeys, sectionName];

				const sectionCatalogs = sectionInfo?.catalogs?.map((c) => (Number.isInteger(c) ? String(c) : c)) ?? [];

				const addCatalogLink = (cLink?: CatalogLink) => {
					if (!cLink || addedCatalogLinks.has(cLink)) return;
					findCatalogLinks.push(cLink);
					addedCatalogLinks.add(cLink);
				};

				for (const catalogName of sectionCatalogs) {
					addCatalogLink(catalogLinksByName.get(catalogName));
				}

				if (level === 0) {
					for (const cLink of catalogLinks) {
						if (cLink.group === sectionName && !sectionCatalogs.includes(cLink.name)) addCatalogLink(cLink);
					}
				}

				const childSections = sectionInfo?.sections
					? getSections(level + 1, sectionInfo?.sections, sectionKeys)
					: null;
				const hasChildSections = !!childSections && Object.keys(childSections).length > 0;

				if (findCatalogLinks.length === 0 && !hasChildSections) continue;

				sections[sectionName] = {
					catalogLinks: findCatalogLinks,
					title: sectionInfo?.title ?? "",
					icon: sectionInfo?.icon || null,
					view: sectionInfo?.view || null,
					href: homeSections.getSectionHref(sectionKeys),
					description: sectionInfo?.description || null,
					sections: childSections,
				};
			}

			return sections;
		};

		const sections = getSections(0, sectionsInfo);
		const otherCatalogLinks = catalogLinks.filter((cLink) => !addedCatalogLinks.has(cLink));
		const mainSection = homeSections.getMainSection(otherCatalogLinks, sections);

		const targetSection = homeSections.findSection(pathSections, mainSection);
		if (pathSections.length !== 1 || targetSection.section.view !== WorkspaceView.section) return targetSection;

		const group = pathSections.pop();
		return { ...homeSections.findSection(pathSections, mainSection), group };
	}

	private async _getReadonlyArticlePage(
		article: Article,
		catalog: ReadonlyCatalog,
	): Promise<ReadonlyArticlePageData> {
		const content = await article.parsedContent.read((p) => p?.renderTree);
		const data = (await this._getArticleData(article, catalog, "read", content)) as ReadonlyArticlePageData;

		return { ...data, mode: "read", openGraphData: await this.getOpenGraphData(article, catalog) };
	}

	private async _getMarkdownArticlePage(
		article: Article,
		catalog: ReadonlyCatalog,
	): Promise<MarkdownArticlePageData> {
		return (await this._getArticleData(
			article,
			catalog,
			"markdown",
			await article.getContent(),
		)) as MarkdownArticlePageData;
	}

	private async _getEditArticlePage(article: Article, catalog: ReadonlyCatalog): Promise<EditArticlePageData> {
		const content = await article.parsedContent.read((p) =>
			JSON.stringify(getArticleWithTitle(article.props.title, p?.editTree)),
		);

		return (await this._getArticleData(article, catalog, "edit", content)) as EditArticlePageData;
	}

	private async _getBaseData(article: Article, catalog: ReadonlyCatalog) {
		const itemLinks = catalog ? await this._nav.getCatalogNav(catalog, article.ref.path.value) : [];
		const articleProps = await this.serializeArticleProps(article, await catalog?.getPathname(article));
		const catalogProps = await this.serializeCatalogProps(catalog);
		const rootRef = catalog ? await this._nav.getRootItemLink(catalog) : null;

		return { itemLinks, articleProps, catalogProps, rootRef };
	}

	private async _getArticleData<T extends ArticlePageDataWithContent>(
		article: Article,
		catalog: ReadonlyCatalog,
		mode: T["mode"],
		content: T["content"],
	): Promise<T> {
		return { ...(await this._getBaseData(article, catalog)), content, mode } as T;
	}
}
