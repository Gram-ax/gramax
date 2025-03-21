import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import getPageDataByPathname, { PageDataType } from "@core/RouterPath/logic/getPageDataByPathname";
import getShareDataFromPathnameData from "@core/RouterPath/logic/getShareDataFromRouterPath";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { Command } from "../../types/Command";
import { ResponseKind } from "@app/types/ResponseKind";

const getPageData: Command<
	{ path: string; ctx: Context },
	{ data: HomePageData | ArticlePageData; context: PageDataContext }
> = Command.create({
	path: "page/getPageData",

	kind: ResponseKind.json,

	async do({ path, ctx }) {
		const getHomePageData = () => this._commands.page.getHomePageData.do({ ctx });
		const getArticlePageData = (path: string[], pathname: string) =>
			this._commands.page.getArticlePageData.do({ path, ctx, pathname });
		const getNotFoundCatalog = (pathname: string, logicPath: string) =>
			this._commands.page.getCatalogNotFoundData.do({ pathname, logicPath, ctx });

		if (!path || path == "/") return getHomePageData();

		const workspace = this._app.wm.maybeCurrent();

		const splittedPath = path.split("/").filter((x) => x);
		if (!RouterPathProvider.isEditorPathname(splittedPath))
			return workspace ? getArticlePageData(splittedPath, path) : getHomePageData();

		const pathnameData = RouterPathProvider.parsePath(splittedPath);

		const { type: pageDataType, itemLogicPath } = await getPageDataByPathname(pathnameData, this._app.wm);

		// https://support.ics-it.ru/issue/GXS-1938
		const data =
			pageDataType === PageDataType.notFound
				? await getArticlePageData(pathnameData.itemLogicPath, pathnameData.itemLogicPath.join("/"))
				: null;

		if (data) return data;

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

	params(ctx, q) {
		const path = q.articlePath;
		return { ctx, path };
	},
});

export default getPageData;
