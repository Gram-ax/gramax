import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import getPageDataByPathname, { PageDataType } from "@core/RouterPath/logic/getPageDataByPathname";
import getShareDataFromPathnameData from "@core/RouterPath/logic/getShareDataFromRouterPath";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { Command } from "../../types/Command";

const getPageData: Command<
	{ path: string; ctx: Context },
	{ data: HomePageData | ArticlePageData; context: PageDataContext }
> = Command.create({
	async do({ path, ctx }) {
		const getHomePageData = () => this._commands.page.getHomePageData.do({ ctx });
		const getArticlePageData = (path: string[]) => this._commands.page.getArticlePageData.do({ path, ctx });
		const getNotFoundArticle = () => getArticlePageData([]);

		if (!path || path == "/") return getHomePageData();

		const { lib } = this._app;
		const splittedPath = path.split("/").filter((x) => x);
		if (!RouterPathProvider.isNewPath(splittedPath)) return getArticlePageData(splittedPath);

		const pathnameData = RouterPathProvider.parsePath(splittedPath);

		const pageDataType = await getPageDataByPathname(pathnameData, lib);

		if (pageDataType === PageDataType.article) return getArticlePageData(pathnameData.itemLogicPath);
		else if (pageDataType === PageDataType.notFound) return getNotFoundArticle();
		else if (pageDataType === PageDataType.home) {
			const { sourceType } = getPartGitSourceDataByStorageName(pathnameData.sourceName);

			const shareData = getShareDataFromPathnameData(pathnameData, sourceType);
			const { context, data } = await getHomePageData();
			return { data, context: { ...context, shareData } };
		}
	},
});

export default getPageData;
