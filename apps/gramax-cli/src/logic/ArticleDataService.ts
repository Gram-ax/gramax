import getPageDataContext from "@app/commands/pageData/getPageDataContext";
import Application from "@app/types/Application";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { ReadonlyBaseCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Category } from "@core/FileStructue/Category/Category";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import SitePresenter, { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import assert from "assert";
import { ExtendedArticlePageData, InitialArticleData } from "./ArticleTypes";
import { getItemLinks, replacePathIfNeeded } from "./NavigationUtils";

export type StaticArticlePageData = {
	articleContentRender: string;
	articleProps: ClientArticleProps;
};

export class ArticleDataService {
	constructor(private readonly _app: Application) {}

	async getArticlesPageData(
		context: Context,
		catalog: Catalog,
		defaultArticle: Article,
		defaultArticleLogicPath: string,
	): Promise<InitialArticleData> {
		const sitePresenter = this._app.sitePresenterFactory.fromContext(context);
		const articlesPageData: ExtendedArticlePageData[] = [];

		const getArticle404InitialData = async () => {
			const itemLinks = await getItemLinks(catalog, "", sitePresenter);

			const article404 = this._app.customArticlePresenter.getArticle("Article404", {});
			const article404PageData = {
				...(await this._getStaticArticlePageData(article404, catalog, context)),
				itemLinks,
			};
			article404PageData.articleProps.logicPath = defaultArticleLogicPath;
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

		await getArticle404InitialData();

		const defaultArticlePageData = await this._createArticlePageData(
			defaultArticle,
			catalog,
			sitePresenter,
			context,
		);
		defaultArticlePageData.articleProps.logicPath = defaultArticleLogicPath;
		articlesPageData.push(defaultArticlePageData);

		for (const item of nav) {
			await processArticleForPageData(item.pathname);
		}

		const articlePageDataContext = await this._getAnonymizedPageDataContext(context);

		const catalogProps = await this._getCatalogProps(sitePresenter, catalog);

		return { catalogProps, articlesPageData, articlePageDataContext };
	}

	async getMultiLangArticlesPageData(catalog: Catalog, logicPath: string): Promise<InitialArticleData[]> {
		return await Promise.all(
			catalog.props.supportedLanguages.map(async (lang) => {
				const ctx = await this._app.contextFactory.fromBrowser(lang, null);
				const sp = this._app.sitePresenterFactory.fromContext(ctx);
				const { catalog, article: initialArticle } = await sp.getArticleByPathOfCatalog([logicPath]);
				let article = initialArticle;
				let articleLogicPath = logicPath;

				if (!article) {
					const root = resolveRootCategory(catalog, catalog.props, ctx.contentLanguage);
					articleLogicPath = root.logicPath;
					const splittedPath = articleLogicPath.split("/").filter((x) => x);
					article = (await sp.getArticleByPathOfCatalog(splittedPath)).article;
				}
				return await this.getArticlesPageData(ctx, catalog.deref, article, articleLogicPath);
			}),
		);
	}

	async getArticle404InitialData(
		catalog: Catalog,
		sitePresenter: SitePresenter,
		context: Context,
		logicPath: string,
	): Promise<ExtendedArticlePageData> {
		const itemLinks = await getItemLinks(catalog, "", sitePresenter);

		const article404 = this._app.customArticlePresenter.getArticle("Article404", { logicPath });

		return {
			...(await this._getStaticArticlePageData(article404, catalog, context)),
			itemLinks,
		};
	}

	private async _getCatalogProps(sitePresenter: SitePresenter, catalog: Catalog) {
		const props = await this._getAnonymizedCatalogProps(sitePresenter, catalog);
		props.link.pathname = RouterPathProvider.getLogicPath(props.link.pathname);
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
		const itemLinks = await getItemLinks(catalog, article.ref.path.value, sitePresenter);

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
		return {
			articleContentRender: JSON.stringify(await article.parsedContent.read((p) => p.renderTree)),
			articleProps,
		};
	}
}
