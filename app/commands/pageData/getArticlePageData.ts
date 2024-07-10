import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import { Article } from "@core/FileStructue/Article/Article";
import LastVisited from "@core/SitePresenter/LastVisited";
import { ArticlePageData, OpenGraphData } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../types/Command";
import getPageDataContext from "./getPageDataContext";

const getArticlePageData: Command<
	{ path: string[]; pathname: string; ctx: Context },
	{ data: ArticlePageData; openGraphData: OpenGraphData; context: PageDataContext }
> = Command.create({
	async do({ path, pathname, ctx }) {
		const { wm, customArticlePresenter, logger, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const dataProvider = sitePresenterFactory.fromContext(ctx);
		logger.logTrace(`Article: ${path.join("/")}`);
		let data: ArticlePageData;
		let openGraphData: OpenGraphData;

		const catalogName = path[0];
		const catalog = await workspace.getCatalog(catalogName);
		const lastVisited = new LastVisited(ctx);
		try {
			data = await dataProvider.getArticlePageDataByPath(path, pathname);
			if (
				(!data || data?.articleProps?.errorCode) &&
				lastVisited.getLastVisitedArticle(catalog) == pathname.replace(/^\//, "")
			)
				data = await dataProvider.getArticlePageDataByPath([catalogName], pathname);
			else data && lastVisited.setLastVisitedArticle(catalog, data.articleProps);

			openGraphData = await dataProvider.getOpenGraphData(path);

			if (!data) {
				const errorArticle = customArticlePresenter.getArticle("Catalog404", { pathname });
				data = await dataProvider.getArticlePageData(errorArticle, catalog);
				openGraphData = await dataProvider.getOpenGraphData(path, errorArticle, catalog);
			}
			data.articleProps.errorCode = data.articleProps.errorCode || null;
		} catch (error) {
			logger.logError(error);
			let article: Article = null;
			try {
				article = (await dataProvider.getArticleByPathOfCatalog(path))?.article ?? null;
			} catch {}

			const showErrorTypeText = !this._app.conf.isReadOnly;
			const errorArticle = customArticlePresenter.getArticle(
				"500",
				{ type: showErrorTypeText ? error?.type ?? null : null },
				article?.ref,
			);
			data = await dataProvider.getArticlePageData(errorArticle, catalog);
			openGraphData = await dataProvider.getOpenGraphData(path, errorArticle, catalog);
		}

		return {
			data,
			openGraphData,
			context: getPageDataContext({
				ctx,
				app: this._app,
				isArticle: true,
				userInfo: data?.catalogProps?.userInfo,
			}),
		};
	},
});

export default getArticlePageData;
