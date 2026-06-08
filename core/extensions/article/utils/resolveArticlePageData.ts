import type { CommandTree } from "@app/commands";
import getPageDataContext from "@app/commands/pageData/getPageDataContext";
import type Application from "@app/types/Application";
import type PageDataContext from "@core/Context/PageDataContext";
import type { Article } from "@core/FileStructue/Article/Article";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import LastVisited from "@core/SitePresenter/LastVisited";
import type SitePresenter from "@core/SitePresenter/SitePresenter";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import type { ArticlePageDataParams } from "@core/SitePresenter/types/PageDataParams";
import { getWorkspaceGesUrl } from "@ext/enterprise/utils/getWorkspaceEnterpriseConfig";
import isReadOnlyBranch from "@ext/enterprise/utils/isReadOnlyBranch";
import type { Workspace } from "@ext/workspace/Workspace";

interface CatalogContext {
	catalog: ContextualCatalog<CatalogProps>;
	workspace: Workspace;
	isReadOnly: boolean;
	dataProvider: SitePresenter;
	lastVisited: LastVisited;
}

type HandleArticlePageDataProps = ArticlePageDataParams & CatalogContext;

type HandleArticleErrorProps = ArticlePageDataParams & CatalogContext & { error: unknown };

type HandlePageDataResult = { data: ArticlePageData };

const prepareCatalogContext = async (app: Application, props: ArticlePageDataParams): Promise<CatalogContext> => {
	const { ctx, path, options } = props;
	const { wm, sitePresenterFactory } = app;

	const catalogName = path.split("/").filter((x) => x)?.[0];
	const catalog = (await wm.getCatalogOrFindAtAnyWorkspace(catalogName))?.ctx(ctx);
	const workspace = wm.current(); // `wm.getCatalogAtAnyWorkspace` can change workspace
	const workspaceConfig = await workspace.config();
	const workspaceGesUrl = getWorkspaceGesUrl(workspaceConfig);

	const isReadOnly = Boolean(
		app.conf.isReadOnly ||
			(options?.mode === "diff" && options?.oldScope?.startsWith("commit")) ||
			!!catalog?.props?.resolvedView ||
			(catalog?.basePath && workspace.getFileProvider().at(catalog.basePath).isReadOnly) ||
			(workspaceGesUrl && (await isReadOnlyBranch(ctx.user, catalog))),
	);

	const dataProvider = sitePresenterFactory.fromContext(ctx, isReadOnly);

	const config = await workspace.config();
	const lastVisited = new LastVisited(ctx, config.name);

	return { catalog, workspace, isReadOnly, dataProvider, lastVisited };
};

const handleArticlePageData = async (
	app: Application,
	commands: CommandTree,
	props: HandleArticlePageDataProps,
): Promise<HandlePageDataResult> => {
	const { customArticlePresenter } = app;
	const { ctx, path, catalog, dataProvider, lastVisited, options } = props;
	const mode = options?.mode;
	const splitPath = path.split("/").filter((x) => x);
	let data: ArticlePageData;

	if (!data) data = await dataProvider.getArticlePageDataByPath(splitPath, props.options);
	if (!data && mode === "diff" && options.oldScope && catalog?.repo?.gvc) {
		data = await commands.page.getDiffModeArticlePageData.do({ ctx, path, options });
	}

	if (
		(!data || data?.articleProps?.errorCode) &&
		lastVisited.getLastVisitedArticle(catalog) === path.replace(/^\//, "")
	)
		data = await dataProvider.getArticlePageDataByPath(splitPath, options);
	else data && lastVisited.setLastVisitedArticle(catalog, data.articleProps);

	if (!data) {
		const errorArticle = customArticlePresenter.getArticle("Catalog404", { path });
		data = await dataProvider.getArticlePageData(errorArticle, catalog, options);
	}
	data.articleProps.errorCode = data.articleProps.errorCode || null;

	return { data };
};

const handleArticleError = async (app: Application, props: HandleArticleErrorProps): Promise<HandlePageDataResult> => {
	const { error, path, options, catalog, dataProvider } = props;
	const { customArticlePresenter, logger } = app;

	logger.logError(error as Error);
	let article: Article = null;

	try {
		article = (await dataProvider.getArticleByPathOfCatalog(path.split("/").filter((x) => x)))?.article ?? null;
	} catch {
		console.error("Error getting article by path of catalog", path);
	}

	const showErrorTypeText = !app.conf.isReadOnly;
	const errorArticle = customArticlePresenter.getArticle(
		"500",
		{ type: showErrorTypeText ? ((error as { type?: string })?.type ?? null) : null },
		article?.ref,
	);
	const data = await dataProvider.getArticlePageData(errorArticle, catalog, options);

	return { data };
};

const resolveArticlePageData = async (
	app: Application,
	commands: CommandTree,
	props: ArticlePageDataParams,
): Promise<{ data: ArticlePageData; context: PageDataContext }> => {
	const { ctx, path } = props;
	const catalogContext = await prepareCatalogContext(app, props);

	app.logger.logTrace(`Article: ${path}`);

	let result: HandlePageDataResult;
	try {
		result = await handleArticlePageData(app, commands, { ...props, ...catalogContext });
	} catch (error) {
		result = await handleArticleError(app, { error, ...props, ...catalogContext });
	}

	return {
		...result,
		context: await getPageDataContext({
			ctx,
			app,
			isArticle: true,
			userInfo: result.data?.catalogProps?.userInfo,
			isReadOnly: catalogContext.isReadOnly,
		}),
	};
};

export default resolveArticlePageData;
