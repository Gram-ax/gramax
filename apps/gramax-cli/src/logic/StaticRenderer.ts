import Application from "@app/types/Application";
import PageDataContext from "@core/Context/PageDataContext";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { renderAppContent } from "../Components/renderAppContent";
import { ArticleDataService, Options } from "./ArticleDataService";
import { HtmlData, InitialArticleData } from "./ArticleTypes";
import { overriddenLanguage } from "@ext/localization/core/model/Language";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import Context from "@core/Context/Context";
import { feature } from "@ext/toggleFeatures/features";

class StaticRenderer {
	private _articleDataService: ArticleDataService;

	constructor(private _app: Application, options: Options) {
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

	private async _getData(catalogName: string): Promise<InitialArticleData[]> {
		const language = RouterPathProvider.parsePath(catalogName).language;
		const ctx = await this._app.contextFactory.fromBrowser({ language });
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

		const getFilteredCatalogs = () =>
			catalog.props.filterProperties?.mapAsync(async (property) => {
				const mutableCatalog = { catalog };
				await this._app.wm.current().events.emit("on-catalog-resolve", {
					mutableCatalog,
					metadata: property,
				});
				await getData(mutableCatalog.catalog);
			});
		if (feature("filtered-catalog")) await getFilteredCatalogs();

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
