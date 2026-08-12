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
import { GitVersion } from "@ext/git/core/model/GitVersion";
import { GitTreeScopeParser } from "@ext/versioning/GitTreeScopeParser";
import isCatalogReadOnly from "@ext/workspace/utils/isCatalogReadOnly";
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

	const isReadOnly = Boolean(
		(options?.diff && !!options?.scope) || (await isCatalogReadOnly(app, workspace, ctx, catalog)),
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
	const splitPath = path.split("/").filter((x) => x);
	let data: ArticlePageData;

	if (!data) data = await dataProvider.getArticlePageDataByPath(splitPath, props.options);
	if (!data && options?.diff && options.oldScope && catalog?.repo?.gvc) {
		data = await commands.page.getDiffModeArticlePageData.do({ ctx, path, options });
	}

	if (
		(!data || data?.articleProps?.errorCode) &&
		lastVisited.getLastVisitedArticle(catalog) === path.replace(/^\//, "")
	)
		data = await dataProvider.getArticlePageDataByPath(splitPath, options);
	else data && lastVisited.setLastVisitedArticle(catalog, data.articleProps);

	if (!data) {
		const errorArticleName = catalog ? "Article404" : "Catalog404";
		const errorArticle = customArticlePresenter.getArticle(errorArticleName, { path });
		data = await dataProvider.getArticlePageData(errorArticle, catalog, { ...options, diff: undefined });
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

const resolveOldScope = async (
	props: ArticlePageDataParams,
	catalogContext: CatalogContext,
): Promise<ArticlePageDataParams> => {
	const { options } = props;
	if (!options?.diff || !options?.scope || options?.oldScope) return props;

	const scopeObj = GitTreeScopeParser.parse(options.scope);
	if (!scopeObj || typeof scopeObj !== "object" || !("commit" in scopeObj)) return props;

	const { gvc } = catalogContext.catalog?.repo ?? {};
	if (!gvc) return props;

	const parentHash = await gvc.getParentCommitHash(new GitVersion(scopeObj.commit));
	if (!parentHash) return props;

	return {
		...props,
		options: { ...options, oldScope: GitTreeScopeParser.toString({ commit: parentHash.toString() }) },
	};
};

const resolveArticlePageData = async (
	app: Application,
	commands: CommandTree,
	props: ArticlePageDataParams,
): Promise<{ data: ArticlePageData; context: PageDataContext }> => {
	const catalogContext = await prepareCatalogContext(app, props);

	const resolvedProps = await resolveOldScope(props, catalogContext);

	let result: HandlePageDataResult;
	try {
		result = await handleArticlePageData(app, commands, { ...resolvedProps, ...catalogContext });
	} catch (error) {
		result = await handleArticleError(app, { error, ...props, ...catalogContext });
	}

	return {
		...result,
		context: await getPageDataContext({
			app,
			ctx: props.ctx,
			isArticle: true,
			userInfo: result.data?.catalogProps?.userInfo,
			isReadOnly: catalogContext.isReadOnly,
		}),
	};
};

export default resolveArticlePageData;
