import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import Path from "@core/FileProvider/Path/Path";
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
		const getArticlePageData = (path: string[], pathname: string) =>
			this._commands.page.getArticlePageData.do({ path, ctx, pathname });
		const getNotFoundCatalog = (pathname: string, logicPath: string) =>
			this._commands.page.getCatalogNotFoundData.do({ pathname, logicPath, ctx });

		if (!path || path == "/") return getHomePageData();

		const splittedPath = path.split("/").filter((x) => x);
		if (!RouterPathProvider.isEditorPathname(splittedPath)) return getArticlePageData(splittedPath, path);

		const pathnameData = RouterPathProvider.parsePath(splittedPath);

		const { type: pageDataType, itemLogicPath } = await getPageDataByPathname(pathnameData, this._app.wm.current());

		if (pageDataType === PageDataType.article) return getArticlePageData(itemLogicPath, path);
		else if (pageDataType === PageDataType.notFound)
			return getNotFoundCatalog(path, Path.join(...pathnameData.itemLogicPath));
		else if (pageDataType === PageDataType.home) {
			const { sourceType } = getPartGitSourceDataByStorageName(pathnameData.sourceName);

			const shareData = getShareDataFromPathnameData(pathnameData, sourceType);
			const { context, data } = await getHomePageData();
			return { data, context: { ...context, shareData } };
		}
	},
});

export default getPageData;
