import { ResponseKind } from "@app/types/ResponseKind";
import type { PageProps } from "@components/Pages/models/Pages";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import getPageDataByPathname, {
	PageDataType as PageDataTypeRouter,
} from "@core/RouterPath/logic/getPageDataByPathname";
import getShareDataFromPathnameData from "@core/RouterPath/logic/getShareDataFromRouterPath";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import homeSections from "@core/utils/homeSections";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { Command } from "../../types/Command";

const getPageData: Command<{ path: string; ctx: Context }, PageProps> = Command.create({
	path: "page/getPageData",

	kind: ResponseKind.json,

	flags: ["otel-omit-result"],

	async do({ path, ctx }) {
		const getHomePageData = (path?: string) => this._commands.page.getHomePageData.do({ ctx, path });
		const getArticlePageData = (path: string[], pathname: string) =>
			this._commands.page.getArticlePageData.do({ path, ctx, pathname });
		const getNotFoundCatalog = (pathname: string, logicPath: string) =>
			this._commands.page.getCatalogNotFoundData.do({ pathname, logicPath, ctx });

		if (!path || path === "/" || homeSections.isHomeSectionPath(path)) {
			const { data, context } = await getHomePageData(path);
			return { page: "home" as const, data, context };
		}

		const workspace = this._app.wm.maybeCurrent();

		const splittedPath = path.split("/").filter((x) => x);
		if (!RouterPathProvider.isEditorPathname(splittedPath)) {
			if (!workspace) {
				const { data, context } = await getHomePageData();
				return { page: "home" as const, data, context };
			}
			const { data, context } = await getArticlePageData(splittedPath, path);
			return { page: "article" as const, data, context };
		}

		const pathnameData = RouterPathProvider.parsePath(splittedPath);

		const { type: pageDataType, itemLogicPath } = await getPageDataByPathname(pathnameData, this._app.wm);

		// https://support.ics-it.ru/issue/GXS-1938
		const notFoundResult =
			pageDataType === PageDataTypeRouter.notFound
				? await getArticlePageData(pathnameData.itemLogicPath, pathnameData.itemLogicPath.join("/"))
				: null;

		if (notFoundResult) {
			const { data, context } = notFoundResult;
			return { page: "article" as const, data, context };
		}

		if (pageDataType === PageDataTypeRouter.article) {
			const { data, context } = await getArticlePageData(itemLogicPath, path);
			return { page: "article" as const, data, context };
		}
		if (pageDataType === PageDataTypeRouter.notFound) {
			const { data, context } = await getNotFoundCatalog(path, Path.join(...pathnameData.itemLogicPath));
			return { page: "article" as const, data, context };
		}
		if (pageDataType === PageDataTypeRouter.home) {
			const { sourceType } = getPartGitSourceDataByStorageName(pathnameData.sourceName);
			const shareData = getShareDataFromPathnameData(pathnameData, sourceType);
			const { context, data } = await getHomePageData();
			return { page: "home" as const, data, context: { ...context, shareData } };
		}
	},

	params(ctx, q) {
		const path = q.path;
		return { ctx, path };
	},
});

export default getPageData;
