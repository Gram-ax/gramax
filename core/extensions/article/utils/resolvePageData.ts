import type { CommandTree } from "@app/commands";
import type { PageProps } from "@components/Pages/models/Pages";
import Path from "@core/FileProvider/Path/Path";
import getPageDataByPathname, { PageDataType } from "@core/RouterPath/logic/getPageDataByPathname";
import getShareDataFromRouterPath from "@core/RouterPath/logic/getShareDataFromRouterPath";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type {
	ArticlePageDataParams,
	HomePageDataParams,
	NotFoundCatalogParams,
	PageDataParams,
} from "@core/SitePresenter/types/PageDataParams";
import homeSections from "@core/utils/homeSections";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";

const getHomePageData = (commands: CommandTree, props: HomePageDataParams) => {
	return commands.page.getHomePageData.do(props);
};

const getArticlePageData = (commands: CommandTree, props: ArticlePageDataParams) => {
	return commands.page.getArticlePageData.do(props);
};

const getNotFoundCatalog = (commands: CommandTree, props: NotFoundCatalogParams) => {
	return commands.page.getCatalogNotFoundData.do(props);
};

const resolvePageData = async (
	commands: CommandTree,
	wm: WorkspaceManager,
	props: PageDataParams,
): Promise<PageProps> => {
	const { path, ctx, options } = props;

	if (!path || path === "/" || homeSections.isHomeSectionPath(path)) {
		const { data, context } = await getHomePageData(commands, props);
		return { page: "home" as const, data, context };
	}

	const workspace = wm.maybeCurrent();

	const splittedPath = path.split("/").filter((x) => x);
	if (!RouterPathProvider.isEditorPathname(splittedPath)) {
		if (!workspace) {
			const { data, context } = await getHomePageData(commands, props);
			return { page: "home" as const, data, context };
		}
		const { data, context } = await getArticlePageData(commands, { ctx, path, options });
		return { page: "article" as const, data, context };
	}

	const pathnameData = RouterPathProvider.parsePath(splittedPath);

	const { type: pageDataType, itemLogicPath } = await getPageDataByPathname(pathnameData, wm);

	// https://support.ics-it.ru/issue/GXS-1938
	const data =
		pageDataType === PageDataType.notFound
			? await getArticlePageData(commands, {
					ctx,
					options: { ...options },
					path: pathnameData.itemLogicPath.join("/"),
				})
			: null;

	if (data) {
		return { page: "article" as const, ...data };
	}

	if (pageDataType === PageDataType.article) {
		const { data, context } = await getArticlePageData(commands, {
			path: itemLogicPath.join("/"),
			options: { ...options },
			ctx,
		});
		return { page: "article" as const, data, context };
	}
	if (pageDataType === PageDataType.notFound) {
		const { data, context } = await getNotFoundCatalog(commands, {
			path: Path.join(...pathnameData.itemLogicPath),
			ctx,
		});
		return { page: "article" as const, data, context };
	}
	if (pageDataType === PageDataType.home) {
		const { sourceType } = getPartGitSourceDataByStorageName(pathnameData.sourceName);
		const shareData = getShareDataFromRouterPath(pathnameData, sourceType);
		const { context, data } = await getHomePageData(commands, props);
		return { page: "home" as const, data, context: { ...context, shareData } };
	}
};

export default resolvePageData;
