import type PageDataContext from "@core/Context/PageDataContext";
import LastVisited from "@core/SitePresenter/LastVisited";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import type { NotFoundCatalogParams } from "@core/SitePresenter/types/PageDataParams";
import { Command } from "../../types/Command";
import getPageDataContext from "./getPageDataContext";

const getCatalogNotFoundData: Command<NotFoundCatalogParams, { data: ArticlePageData; context: PageDataContext }> =
	Command.create({
		async do({ path, ctx }) {
			const { customArticlePresenter, logger, sitePresenterFactory, wm } = this._app;

			const dataProvider = sitePresenterFactory.fromContext(ctx);
			const workspace = wm.maybeCurrent();
			const lastVisited = new LastVisited(ctx, (await workspace?.config())?.name);

			const catalogName = path.split("/")[0];
			if (catalogName) workspace ? lastVisited.remove(catalogName) : lastVisited.clear();

			logger.logTrace(`Article: ${path}`);

			const errorArticle = customArticlePresenter.getArticle("Catalog404", { path });
			const catalog = await workspace.getContextlessCatalog(catalogName);
			const data = await dataProvider.getArticlePageData(errorArticle, catalog);
			data.articleProps.errorCode = data.articleProps.errorCode || null;

			return {
				data,
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
