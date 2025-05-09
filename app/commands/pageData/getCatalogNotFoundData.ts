import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import LastVisited from "@core/SitePresenter/LastVisited";
import { ArticlePageData, OpenGraphData } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../types/Command";
import getPageDataContext from "./getPageDataContext";

const getCatalogNotFoundData: Command<
	{ pathname: string; logicPath: string; ctx: Context },
	{ data: ArticlePageData; openGraphData: OpenGraphData; context: PageDataContext }
> = Command.create({
	async do({ pathname, logicPath, ctx }) {
		const { customArticlePresenter, logger, sitePresenterFactory, wm } = this._app;
		const dataProvider = sitePresenterFactory.fromContext(ctx);
		const workspace = wm.maybeCurrent();
		const config = await workspace?.config();
		const lastVisited = new LastVisited(ctx, config?.name);
		const catalogName = logicPath.split("/")[0];
		if (catalogName) workspace ? lastVisited.remove(catalogName) : lastVisited.clear();
		logger.logTrace(`Article: ${logicPath}`);
		const errorArticle = customArticlePresenter.getArticle("Catalog404", { pathname });
		const catalog = undefined;
		const data = await dataProvider.getArticlePageData(errorArticle, catalog);
		const openGraphData = await dataProvider.getOpenGraphData(pathname.split("/"), errorArticle, catalog);
		data.articleProps.errorCode = data.articleProps.errorCode || null;

		return {
			data,
			openGraphData,
			context: await getPageDataContext({
				ctx,
				app: this._app,
				isArticle: true,
				userInfo: data?.catalogProps?.userInfo,
			}),
		};
	},
});

export default getCatalogNotFoundData;
