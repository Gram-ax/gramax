import Application from "@app/types/Application";
import PageDataContext from "@core/Context/PageDataContext";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { renderAppContent } from "../Components/renderAppContent";
import { ArticleDataService } from "./ArticleDataService";
import { ArticleDataResult, HtmlData, InitialArticleData, RenderedHtml } from "./ArticleTypes";

class StaticRenderer {
	private _articleDataService: ArticleDataService;

	constructor(private _app: Application) {
		this._articleDataService = new ArticleDataService(_app);
	}

	async render(logicPath: string): Promise<RenderedHtml> {
		const { article404Data, defaultArticleData, languageGroupedArticles } = await this._getData(logicPath);

		const { articlePageData: defaultArticlePageData, catalogProps, articlePageDataContext } = defaultArticleData;

		const article404PageData = {
			...article404Data,
			...defaultArticleData,
			itemLinks: defaultArticlePageData.itemLinks,
		};

		const article404HtmlContent = renderAppContent(article404PageData, articlePageDataContext);

		const defaultPageData = {
			...defaultArticlePageData,
			...defaultArticleData,
		};

		const defaultHtmlContent = renderAppContent(defaultPageData, articlePageDataContext);

		const normalizedContext = this._modifyContextForStaticGeneration(articlePageDataContext);

		const article404InitialData = {
			data: {
				articlePageData: article404Data,
				catalogProps,
			},
			context: normalizedContext,
		};

		const defaultInitialData = {
			data: {
				articlePageData: defaultArticlePageData,
				catalogProps,
			},
			context: normalizedContext,
		};

		const article404Html = {
			htmlContent: article404HtmlContent,
			initialData: article404InitialData,
			logicPath,
		};

		const defaultHtml = {
			htmlContent: defaultHtmlContent,
			initialData: defaultInitialData,
			logicPath,
		};

		const htmlData = this._getArticlesHtmlData(languageGroupedArticles);

		return {
			htmlData,
			defaultHtml,
			article404Html,
		};
	}

	private _getArticlesHtmlData(languageGroupedArticles: InitialArticleData[]) {
		const htmlData: HtmlData[] = [];

		for (const { catalogProps, articlesPageData, articlePageDataContext } of languageGroupedArticles) {
			const renderedHtmls = articlesPageData.map((articlePageData) => {
				const articleData = {
					...articlePageData,
					catalogProps,
				};

				const htmlContent = renderAppContent(articleData, articlePageDataContext);

				return {
					htmlContent,
					articlePageData,
				};
			});

			const context = this._modifyContextForStaticGeneration(articlePageDataContext);

			renderedHtmls.map(({ htmlContent, articlePageData }) =>
				htmlData.push({
					htmlContent,
					initialData: {
						data: { articlePageData, catalogProps },
						context,
					},
					logicPath: articlePageData.articleProps.logicPath,
				}),
			);
		}
		return htmlData;
	}

	private _modifyContextForStaticGeneration(pageDataContext: PageDataContext) {
		const { workspace } = pageDataContext;
		workspace.current = "/";
		workspace.workspaces = [workspace.workspaces[0]];
		workspace.workspaces[0].path = "/";
		return pageDataContext;
	}

	private async _getData(logicPath: string): Promise<ArticleDataResult> {
		const lang = RouterPathProvider.parsePath(logicPath).language;
		const ctx = await this._app.contextFactory.fromBrowser(lang, null);
		const sp = this._app.sitePresenterFactory.fromContext(ctx);
		const { catalog: contextualCatalog, article: defaultArticle } = await sp.getArticleByPathOfCatalog([logicPath]);
		const catalog = contextualCatalog.deref;

		const article404Data = await this._articleDataService.getArticle404InitialData(catalog, sp, ctx);
		const defaultArticleData = await this._articleDataService.getDefaultArticlePageData(
			catalog,
			defaultArticle,
			ctx,
		);

		const languageGroupedArticles = catalog.props.supportedLanguages?.length
			? await this._articleDataService.getMultiLangArticlesPageData(catalog, logicPath)
			: [await this._articleDataService.getArticlesPageData(ctx, catalog)];

		return {
			article404Data,
			defaultArticleData,
			languageGroupedArticles,
		};
	}
}

export default StaticRenderer;
