import { getExecutingEnvironment } from "@app/resolveModule/env";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import LastVisited from "@core/SitePresenter/LastVisited";
import homeSections from "@core/utils/homeSections";
import htmlToText from "@dynamicImports/htmlToText";
import type { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { RefInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { catalogHasItems, isLanguageCategory, resolveRootCategory } from "@ext/localization/core/catalogExt";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { StoredQuestion } from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import { getStoredQuestionsByContent } from "@ext/markdown/elements/question/render/logic/getStoredQuestionsByContent";
import NavigationEventHandlers from "@ext/navigation/events/NavigationEventHandlers";
import getAllCatalogProperties from "@ext/properties/logic/getAllCatalogProps";
import { Property, PropertyValue, type PropertyID } from "@ext/properties/models";
import RuleProvider from "@ext/rules/RuleProvider";
import { TemplateField } from "@ext/templates/models/types";
import type { Workspace } from "@ext/workspace/Workspace";
import type { WorkspaceConfig, WorkspaceSection } from "@ext/workspace/WorkspaceConfig";
import { WorkspaceView } from "@ext/workspace/WorkspaceConfig";
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
import { QuizSettings } from "@ext/quiz/models/types";

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
	docrootIsNoneExsistent?: boolean;
	notFound: boolean;
	resolvedFilterProperty?: PropertyID;
	filterProperties?: PropertyID[];
	logo?: string;
	logo_dark?: string;
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
		private _isReadOnly: boolean,
	) {
		new NavigationEventHandlers(this._nav, this._context, this._customArticlePresenter).mount();
		this._filters = new RuleProvider(this._context, this._nav, this._customArticlePresenter).getItemFilters();
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
				c.props.language == this._context.contentLanguage,
		);
		const { section, breadcrumb, group } = this._getSection(catalogsLinks, sectionsInfo, pathSections);

		return { section, catalogsLinks, breadcrumb, group };
	}

	async getArticlePageData(article: Article, catalog: ReadonlyCatalog): Promise<ArticlePageData> {
		if (!this._isReadOnly && !catalog?.customProviders?.templateProvider?.isTransferedLegacyProperties()) {
			const formatter = new MarkdownFormatter();
			await catalog?.customProviders?.templateProvider?.transferLegacyProperties(
				new ResourceUpdaterFactory(this._parser, this._parserContextFactory, formatter),
				this._parserContextFactory,
				this._parser,
				formatter,
				this._context,
			);
		}

		await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);

		const itemLinks = catalog ? await this._nav.getCatalogNav(catalog, article.ref.path.value) : [];

		const { edit, render } = await article.parsedContent.read((p) => {
			if (!p) return { render: null, edit: null };

			return {
				render: JSON.stringify(p.renderTree),
				edit: !this._isReadOnly ? JSON.stringify(getArticleWithTitle(article.props.title, p.editTree)) : null,
			};
		});

		return {
			markdown: this._isReadOnly ? article.content : null,
			articleContentRender: render,
			articleContentEdit: edit,
			articleProps: await this.serializeArticleProps(article, await catalog?.getPathname(article)),
			catalogProps: await this.serializeCatalogProps(catalog),
			rootRef: catalog ? await this._nav.getRootItemLink(catalog) : null,
			itemLinks,
		};
	}

	async getArticlePageDataByPath(path: string[], pathname?: string): Promise<ArticlePageData> {
		const data = await this.getArticleByPathOfCatalog(path);
		if (!data.catalog) return null;
		if (!data.article) {
			data.article = catalogHasItems(data.catalog, this._context.contentLanguage || data.catalog.props.language)
				? this._customArticlePresenter.getArticle("Article404", { pathname, logicPath: path.join("/") })
				: this._customArticlePresenter.getArticle("welcome");
		}
		return await this.getArticlePageData(data.article, data.catalog);
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
		if (getExecutingEnvironment() !== "next") return null;
		const { article, catalog } = readyArticle
			? { article: readyArticle, catalog: readyCatalog }
			: await this.getArticleByPathOfCatalog(path, [this._filters[1], this._filters[2]]);

		if (!article) return null;
		if (await article.parsedContent.isNull())
			await parseContent(article, catalog, this._context, this._parser, this._parserContextFactory);
		const { convert } = await htmlToText();
		const htmlValue = await article.parsedContent.read((p) => p?.getHtmlValue.get());
		let description =
			article.props["summary"] ??
			convert(htmlValue, {
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
		let storedQuestions: Record<string, StoredQuestion> = null;
		if (this._isReadOnly) {
			const renderTree = await article.parsedContent.read((p) => p?.renderTree);
			storedQuestions = getStoredQuestionsByContent(renderTree);
		}

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
			questions: storedQuestions,
			quiz: article.props.quiz ?? null,
			searchPhrases: article.props.searchPhrases ?? [],
		};
	}

	async serializeCatalogProps(catalog: ReadonlyBaseCatalog): Promise<ClientCatalogProps> {
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
			};
		}

		const sourceName = await catalog.repo?.storage?.getSourceName();

		const workspaceConfig = await this._workspace.config();
		const link = await this._nav.getCatalogLink(catalog, new LastVisited(this._context, workspaceConfig.name));
		const syntax = catalog.props.syntax;

		return {
			notFound: false,
			link,
			relatedLinks: await this._nav.getRelatedLinks(catalog),
			contactEmail: catalog.props.contactEmail ?? null,
			name: catalog.name ?? null,
			title: catalog.props.title ?? "",
			language: catalog.props.language,
			properties: getAllCatalogProperties(catalog),
			repositoryName: catalog.name,
			repositoryError: catalog.repo instanceof BrokenRepository ? catalog.repo.error : null,
			sourceName,
			userInfo: this._grp.getSourceUserInfo(this._context, sourceName),
			docroot: catalog.getRelativeRootCategoryPath()?.value,
			supportedLanguages: Array.from(catalog.props.supportedLanguages || []),
			versions: catalog.props.versions,
			filterProperties: catalog.props.filterProperties,
			resolvedVersion: catalog.props.resolvedVersion,
			resolvedFilterProperty: catalog.props.resolvedFilterProperty,
			resolvedVersions: catalog.props.resolvedVersions,
			syntax: syntax?.toUpperCase() === Syntax.xml ? Syntax.xml : syntax,
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

		const finalFilters = !root.parent ? [(i) => !isLanguageCategory(catalog, i), ...filters] : filters;
		let article = catalog.findArticle(itemLogicPath, finalFilters, root);

		// ! Hack, because we need to 😢
		// ? Checks if the found category is a language category, then redirects user to first child, or to any other first in route
		if (isLanguageCategory(catalog, article)) {
			if (this._context.contentLanguage || catalog.props.language != this._context.contentLanguage)
				article = (article as Category).items[0] as Article;
			else article = catalog.getRootCategory().items.find((i) => !isLanguageCategory(catalog, i)) as Article;
		}

		return { article, catalog };
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

				for (const cLink of catalogLinks) {
					if (sectionCatalogs.includes(cLink.name) || (level === 0 && cLink.group === sectionName)) {
						findCatalogLinks.push(cLink);
						addedCatalogLinks.add(cLink);
					}
				}

				if (findCatalogLinks.length === 0 && !sectionInfo?.sections) continue;

				sections[sectionName] = {
					catalogLinks: findCatalogLinks,
					title: sectionInfo?.title ?? "",
					icon: sectionInfo?.icon,
					view: sectionInfo?.view,
					href: homeSections.getSectionHref(sectionKeys),
					description: sectionInfo?.description,
					sections: sectionInfo?.sections ? getSections(level + 1, sectionInfo?.sections, sectionKeys) : null,
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

	private _isLogged(): boolean {
		return this._context.user?.isLogged ?? false;
	}

	private _getLang(catalog: ReadonlyCatalog): UiLanguage {
		return convertContentToUiLanguage(this._context.contentLanguage || catalog.props.language);
	}
}
