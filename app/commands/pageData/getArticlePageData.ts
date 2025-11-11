import { getExecutingEnvironment } from "@app/resolveModule/env";
import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import { Article } from "@core/FileStructue/Article/Article";
import LastVisited from "@core/SitePresenter/LastVisited";
import { ArticlePageData, OpenGraphData } from "@core/SitePresenter/SitePresenter";
import isReadOnlyBranch from "@ext/enterprise/utils/isReadOnlyBranch";
import { Command } from "../../types/Command";
import getPageDataContext from "./getPageDataContext";

const getArticlePageData: Command<
	{ path: string[]; pathname: string; ctx: Context },
	{ data: ArticlePageData; openGraphData: OpenGraphData; context: PageDataContext }
> = Command.create({
	async do({ path, pathname, ctx }) {
		const { wm, customArticlePresenter, logger, sitePresenterFactory } = this._app;

		logger.logTrace(`Article: ${path.join("/")}`);
		let data: ArticlePageData;
		let openGraphData: OpenGraphData;

		const catalogName = path[0];
		const catalog = await wm.getCatalogOrFindAtAnyWorkspace(catalogName);
		if (getExecutingEnvironment() !== "static" && getExecutingEnvironment() !== "next" && catalog)
			await catalog.parseEveryArticle(ctx, this._app.parser, this._app.parserContextFactory);

		const workspace = wm.current(); // `wm.getCatalogAtAnyWorkspace` can change workspace

		const isReadOnly =
			this._app.conf.isReadOnly ||
			(catalog?.basePath && workspace.getFileProvider().at(catalog.basePath).isReadOnly) ||
			(this._app.em.getConfig().gesUrl && (await isReadOnlyBranch(ctx.user, catalog)));

		const dataProvider = sitePresenterFactory.fromContext(ctx, isReadOnly);

		const config = await workspace.config();
		const lastVisited = new LastVisited(ctx, config.name);
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
			context: await getPageDataContext({
				ctx,
				app: this._app,
				isArticle: true,
				userInfo: data?.catalogProps?.userInfo,
				isReadOnly,
			}),
		};
	},
});

export default getArticlePageData;
