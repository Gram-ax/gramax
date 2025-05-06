import getPageDataContext from "@app/commands/pageData/getPageDataContext";
import Application from "@app/types/Application";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import SitePresenter, { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import assert from "assert";
import { ExtendedArticlePageData, InitialArticleData } from "./ArticleTypes";
import { getItemLinks } from "./NavigationUtils";

export type StaticArticlePageData = {
	articleContentRender: string;
	articleProps: ClientArticleProps;
};

export class ArticleDataService {
	constructor(private readonly _app: Application) {}

	async getDefaultArticlePageData(
		catalog: Catalog,
		defaultArticle: Article,
		context: Context,
	): Promise<InitialArticleData> {
		const sp = this._app.sitePresenterFactory.fromContext(context);
		const catalogProps = await sp.serializeCatalogProps(catalog);
		const itemLinks = await getItemLinks(catalog, defaultArticle.ref.path.value, sp);

		const articlePageData: ExtendedArticlePageData = {
			...(await this._getStaticArticlePageData(defaultArticle, catalog, context)),
			itemLinks,
		};

		const articlePageDataContext = await this._getPageDataContext(context);

		return { catalogProps, articlePageData, articlePageDataContext };
	}

	async getArticlesPageData(context: Context, catalog: Catalog): Promise<InitialArticleData> {
		const sp = this._app.sitePresenterFactory.fromContext(context);
		const articlesPageData: ExtendedArticlePageData[] = [];

		const processArticleForPageData = async (pathname: string) => {
			const logicPath = RouterPathProvider.getLogicPath(pathname);
			const article = catalog.findArticle(logicPath, []);

			articlesPageData.push(await this._createArticlePageData(article, catalog, sp, context));

			if ((article as Category).items) {
				for (const item of (article as Category).items) {
					await processArticleForPageData(item.logicPath);
				}
			}
		};

		const nav = await sp.getCatalogNav(catalog, "");

		for (const item of nav) {
			await processArticleForPageData(item.pathname);
		}

		const articlePageDataContext = await this._getPageDataContext(context);

		const catalogProps = await sp.serializeCatalogProps(catalog);
		catalogProps.language = context.contentLanguage;

		return { catalogProps, articlesPageData, articlePageDataContext };
	}

	async getMultiLangArticlesPageData(catalog: Catalog, logicPath: string): Promise<InitialArticleData[]> {
		return await Promise.all(
			catalog.props.supportedLanguages.map(async (lang) => {
				const ctx = await this._app.contextFactory.fromBrowser(lang, null);
				const sp = this._app.sitePresenterFactory.fromContext(ctx);
				const catalog = (await sp.getArticleByPathOfCatalog([logicPath])).catalog.deref;
				return await this.getArticlesPageData(ctx, catalog);
			}),
		);
	}

	async getArticle404InitialData(
		catalog: Catalog,
		sitePresenter: SitePresenter,
		context: Context,
	): Promise<ExtendedArticlePageData> {
		const itemLinks = await getItemLinks(catalog, "", sitePresenter);

		const article404 = this._app.customArticlePresenter.getArticle("Article404", {});

		return {
			...(await this._getStaticArticlePageData(article404, catalog, context)),
			itemLinks,
		};
	}

	private _getPageDataContext(ctx: Context) {
		return getPageDataContext({
			ctx,
			app: this._app,
			isArticle: true,
			isReadOnly: true,
		});
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
		const catalogFolderPath = catalog.getRootCategory().folderPath.value;
		const catalogBasePath = catalog.basePath.value;
		const articleProps = await sp.serializeArticleProps(article, await catalog.getPathname(article));
		articleProps.ref.path = articleProps.ref.path.replace(catalogFolderPath, catalogBasePath);
		return {
			articleContentRender: JSON.stringify(await article.parsedContent.read((p) => p.renderTree)),
			articleProps,
		};
	}
}
