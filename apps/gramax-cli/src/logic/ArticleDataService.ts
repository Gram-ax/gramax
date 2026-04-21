import getPageDataContext from "@app/commands/pageData/getPageDataContext";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { ReadonlyBaseCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type SitePresenter from "@core/SitePresenter/SitePresenter";
import type { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import type { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import assert from "assert";
import type { ExtendedArticlePageData, InitialArticleData } from "./ArticleTypes";
import { getItemLinks, replacePathIfNeeded, stripCatalogPrefix } from "./NavigationUtils";

export type StaticArticlePageData = {
	mode: "read";
	content: RenderableTreeNode;
	articleProps: ClientArticleProps;
};

export interface Options {
	pdfTemplates?: string[];
	wordTemplates?: string[];
	singleCatalog?: boolean;
}

export class ArticleDataService {
	constructor(
		private readonly _app: Application,
		private readonly _options: Options,
	) {}

	private get _singleCatalog(): boolean {
		return !!this._options.singleCatalog;
	}

	private _stripCatalogPathsFromArticleProps(articleProps: ClientArticleProps, catalogName: string) {
		if (!this._singleCatalog) return;
		if (articleProps.logicPath) articleProps.logicPath = stripCatalogPrefix(articleProps.logicPath, catalogName);
		if (articleProps.pathname) articleProps.pathname = stripCatalogPrefix(articleProps.pathname, catalogName);
		if (articleProps.ref?.path) articleProps.ref.path = stripCatalogPrefix(articleProps.ref.path, catalogName);
	}

	private _stripCatalogFromRenderTree(node: unknown, catalogName: string): void {
		if (!node || typeof node !== "object") return;
		if (Array.isArray(node)) {
			for (const child of node) this._stripCatalogFromRenderTree(child, catalogName);
			return;
		}
		const n = node as { attributes?: Record<string, unknown>; children?: unknown };
		const attrs = n.attributes;
		if (attrs) {
			for (const key of ["href", "renderSrc", "resourcePath"]) {
				const val = attrs[key];
				if (typeof val === "string") attrs[key] = stripCatalogPrefix(val, catalogName);
			}
		}
		if (n.children) this._stripCatalogFromRenderTree(n.children, catalogName);
	}

	async getArticlesPageData(
		context: Context,
		catalog: Catalog,
		defaultArticle: Article,
		defaultArticleLogicPath: string,
	): Promise<InitialArticleData> {
		const sitePresenter = this._app.sitePresenterFactory.fromContext(context);
		const articlesPageData: ExtendedArticlePageData[] = [];

		const effectiveDefaultLogicPath = this._singleCatalog
			? stripCatalogPrefix(defaultArticleLogicPath, catalog.name)
			: defaultArticleLogicPath;

		const getArticle404InitialData = async () => {
			const itemLinks = await getItemLinks(catalog, "", sitePresenter, this._singleCatalog);

			const article404 = this._app.customArticlePresenter.getArticle("Article404", {});
			const article404PageData = {
				...(await this._getStaticArticlePageData(article404, catalog, context)),
				itemLinks,
			};
			article404PageData.articleProps.logicPath = effectiveDefaultLogicPath;
			articlesPageData.push(article404PageData);
		};

		const processArticleForPageData = async (pathname: string) => {
			const logicPath = RouterPathProvider.getLogicPath(pathname);
			const article = catalog.findArticle(logicPath, []);

			articlesPageData.push(await this._createArticlePageData(article, catalog, sitePresenter, context));

			if ((article as Category).items) {
				for (const item of (article as Category).items) {
					await processArticleForPageData(item.logicPath);
				}
			}
		};

		const nav = await sitePresenter.getCatalogNav(catalog, "");

		if (!catalog.props.resolvedFilterPropertyValue) await getArticle404InitialData();

		const defaultArticlePageData = await this._createArticlePageData(
			defaultArticle,
			catalog,
			sitePresenter,
			context,
		);
		defaultArticlePageData.articleProps.logicPath = effectiveDefaultLogicPath;
		articlesPageData.push(defaultArticlePageData);

		for (const item of nav) {
			await processArticleForPageData(item.pathname);
		}

		const articlePageDataContext = await this._getAnonymizedPageDataContext(context);

		const catalogProps = await this._getCatalogProps(sitePresenter, catalog);

		return { catalogProps, articlesPageData, articlePageDataContext };
	}

	async getMultiLangArticlesPageData(catalog: Catalog): Promise<InitialArticleData[]> {
		const defaultLogicPath = catalog.name;
		return catalog.props.supportedLanguages.mapAsync(async (language) => {
			const ctx = await this._app.contextFactory.fromBrowser({ language });
			const sp = this._app.sitePresenterFactory.fromContext(ctx);
			const { catalog, article: initialArticle } = await sp.getArticleByPathOfCatalog([defaultLogicPath]);
			let article = initialArticle;
			let articleLogicPath = defaultLogicPath;

			if (!article) {
				const root = resolveRootCategory(catalog, catalog.props, ctx.contentLanguage);
				articleLogicPath = root.logicPath;
				const splittedPath = articleLogicPath.split("/").filter((x) => x);
				article = (await sp.getArticleByPathOfCatalog(splittedPath)).article;
			}
			return await this.getArticlesPageData(ctx, catalog.deref, article, articleLogicPath);
		});
	}

	async getArticle404InitialData(
		catalog: Catalog,
		sitePresenter: SitePresenter,
		context: Context,
		logicPath: string,
	): Promise<ExtendedArticlePageData> {
		const itemLinks = await getItemLinks(catalog, "", sitePresenter, this._singleCatalog);

		const article404 = this._app.customArticlePresenter.getArticle("Article404", { logicPath });

		return {
			...(await this._getStaticArticlePageData(article404, catalog, context)),
			itemLinks,
		};
	}

	private async _getCatalogProps(sitePresenter: SitePresenter, catalog: Catalog) {
		const props = await this._getAnonymizedCatalogProps(sitePresenter, catalog);
		props.link.pathname = RouterPathProvider.getLogicPath(props.link.pathname);
		if (this._singleCatalog && props.link.pathname) {
			props.link.pathname = stripCatalogPrefix(props.link.pathname, catalog.name);
		}
		return props;
	}

	private async _getAnonymizedPageDataContext(ctx: Context) {
		const pageDataContext = await getPageDataContext({
			ctx,
			app: this._app,
			isArticle: true,
			isReadOnly: true,
		});
		pageDataContext.userInfo = null;
		pageDataContext.wordTemplates = this._options.wordTemplates || [];
		pageDataContext.pdfTemplates = this._options.pdfTemplates || [];
		return pageDataContext;
	}

	private async _getAnonymizedCatalogProps(
		sitePresenter: SitePresenter,
		catalog: ReadonlyBaseCatalog,
	): Promise<ClientCatalogProps> {
		const props = await sitePresenter.serializeCatalogProps(catalog);
		props.repositoryName = null;
		props.sourceName = null;
		props.userInfo = null;
		return props;
	}

	private async _createArticlePageData(
		article: Article,
		catalog: Catalog,
		sitePresenter: SitePresenter,
		context: Context,
	): Promise<ExtendedArticlePageData> {
		const itemLinks = await getItemLinks(catalog, article.ref.path.value, sitePresenter, this._singleCatalog);

		return {
			...(await this._getStaticArticlePageData(article, catalog, context)),
			itemLinks,
		};
	}

	private async _getStaticArticlePageData(
		article: Article,
		catalog: Catalog,
		context: Context,
	): Promise<StaticArticlePageData> {
		assert(article, "Article must be provided to getStaticArticlePageData");
		assert(catalog, "Catalog must be provided to getStaticArticlePageData");
		const sp = this._app.sitePresenterFactory.fromContext(context);
		await parseContent(article, catalog, context, this._app.parser, this._app.parserContextFactory);
		const articleProps = await sp.serializeArticleProps(article, await catalog.getPathname(article));
		articleProps.ref.path = replacePathIfNeeded(articleProps.ref.path, catalog);
		this._stripCatalogPathsFromArticleProps(articleProps, catalog.name);
		const content = await article.parsedContent.read((p) => p.renderTree);
		if (this._singleCatalog) this._stripCatalogFromRenderTree(content, catalog.name);
		return {
			mode: "read",
			content,
			articleProps,
		};
	}
}
