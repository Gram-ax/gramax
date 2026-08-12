import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type PageDataContext from "@core/Context/PageDataContext";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { renderAppContent } from "../Components/renderAppContent";
import { ArticleDataService, type Options } from "./ArticleDataService";
import type { HtmlData, InitialArticleData } from "./ArticleTypes";

export const STATIC_WORKSPACE_PATH = "/";

class StaticRenderer {
	private _articleDataService: ArticleDataService;

	constructor(
		private _app: Application,
		options: Options,
	) {
		this._articleDataService = new ArticleDataService(_app, options);
	}

	async render(catalogName: string): Promise<HtmlData[]> {
		const languageGroupedArticles = await this._getData(catalogName);
		const htmlData = this._getArticlesHtmlData(languageGroupedArticles);
		return htmlData;
	}

	private _getArticlesHtmlData(languageGroupedArticles: InitialArticleData[]) {
		const htmlData: HtmlData[] = [];

		for (const { catalogProps, articlesPageData, articlePageDataContext } of languageGroupedArticles) {
			const renderedHtmls = articlesPageData.map((articlePageData) => {
				const articleData = {
					...articlePageData,
					catalogProps,
					openGraphData: null,
				};

				let htmlContent: ReturnType<typeof renderAppContent>;
				const logicPath = articleData.articleProps.logicPath;

				try {
					htmlContent = renderAppContent(articleData, articlePageDataContext);
				} catch (e) {
					e.message = `Failed to render article "${logicPath}"\n${e.message}`;
					throw e;
				}

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
		workspace.current = STATIC_WORKSPACE_PATH;
		workspace.workspaces = [workspace.workspaces[0]];
		workspace.workspaces[0].path = STATIC_WORKSPACE_PATH;
		return pageDataContext;
	}

	private async _getData(catalogName: string): Promise<InitialArticleData[]> {
		const language = RouterPathProvider.parsePath(catalogName).language;
		const ctx = await this._app.contextFactory.fromWeb({ language });
		const contextualCatalog = await this._app.wm.current().getCatalog(catalogName, ctx);
		const catalog = contextualCatalog.deref;

		const groupedArticles = await this._getArticlesData(catalog, ctx);

		return groupedArticles;
	}

	private async _getArticlesData(catalog: Catalog, ctx: Context): Promise<InitialArticleData[]> {
		const sp = this._app.sitePresenterFactory.fromContext(ctx);
		const initialArticleData: InitialArticleData[] = [];

		const getData = async (currentCatalog: Catalog) => {
			const { article } = await sp.getArticleByPathOfCatalog([currentCatalog.name]);
			initialArticleData.push(...(await this._getArticleDataItems(currentCatalog, ctx, article)));
		};
		await getData(catalog);

		return initialArticleData;
	}

	private async _getArticleDataItems(
		catalog: Catalog,
		ctx: Context,
		defaultArticle: Article,
	): Promise<InitialArticleData[]> {
		return catalog.props.supportedLanguages?.length
			? await this._articleDataService.getMultiLangArticlesPageData(catalog)
			: [await this._articleDataService.getArticlesPageData(ctx, catalog, defaultArticle, catalog.name)];
	}
}

export default StaticRenderer;
