import Application from "@app/types/Application";
import PageDataContext from "@core/Context/PageDataContext";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { renderAppContent } from "../Components/renderAppContent";
import { ArticleDataService } from "./ArticleDataService";
import { HtmlData, InitialArticleData } from "./ArticleTypes";
import { overriddenLanguage } from "@ext/localization/core/model/Language";

class StaticRenderer {
	private _articleDataService: ArticleDataService;

	constructor(private _app: Application) {
		this._articleDataService = new ArticleDataService(_app);
	}

	async render(logicPath: string): Promise<HtmlData[]> {
		const languageGroupedArticles = await this._getData(logicPath);
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
		const { workspace, language } = pageDataContext;
		pageDataContext.theme = null;
		workspace.current = "/";
		workspace.workspaces = [workspace.workspaces[0]];
		workspace.workspaces[0].path = "/";
		language.ui = overriddenLanguage || null;
		return pageDataContext;
	}

	private async _getData(logicPath: string): Promise<InitialArticleData[]> {
		const language = RouterPathProvider.parsePath(logicPath).language;
		const ctx = await this._app.contextFactory.fromBrowser({
			language,
		});
		const sp = this._app.sitePresenterFactory.fromContext(ctx);
		const { catalog: contextualCatalog, article: defaultArticle } = await sp.getArticleByPathOfCatalog([logicPath]);
		const catalog = contextualCatalog.deref;

		const languageGroupedArticles = catalog.props.supportedLanguages?.length
			? await this._articleDataService.getMultiLangArticlesPageData(catalog, logicPath)
			: [await this._articleDataService.getArticlesPageData(ctx, catalog, defaultArticle, logicPath)];

		return languageGroupedArticles;
	}
}

export default StaticRenderer;
