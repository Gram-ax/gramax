import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import type { ArticlePageDataParams } from "@core/SitePresenter/types/PageDataParams";
import isReadOnlyBranch from "@ext/enterprise/utils/isReadOnlyBranch";
import getScopeFromString from "@ext/git/core/Diff/logic/utils/getScopeFromString";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import convertScopeToCommitScope from "@ext/git/core/ScopedCatalogs/convertScopeToCommitScope";
import assert from "assert";

const getDiffModeArticlePageData: Command<ArticlePageDataParams, ArticlePageData> = Command.create({
	path: "page/getDiffModeArticlePageData",

	kind: ResponseKind.json,

	async do({ ctx, path, options }) {
		if (options.mode !== "diff") return null;
		const { scope, oldScope } = options;
		const splitPath = path.split("/");
		const { wm, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalogName = splitPath[0];
		const catalog = (await workspace.getContextlessCatalog(catalogName))?.ctx(ctx);
		assert(catalog);

		assert(catalog.repo && !(catalog.repo instanceof BrokenRepository), "Catalog has no valid repository");

		const isReadOnly =
			this._app.conf.isReadOnly ||
			!!scope ||
			!!catalog?.props?.resolvedView ||
			(catalog?.basePath && workspace.getFileProvider().at(catalog.basePath).isReadOnly) ||
			(this._app.em.getConfig().gesUrl && (await isReadOnlyBranch(ctx.user, catalog)));

		const dataProvider = sitePresenterFactory.fromContext(ctx, isReadOnly);

		const fs = workspace.getFileStructure();
		const oldScopeObj = getScopeFromString(oldScope);
		const commitScope = await convertScopeToCommitScope(oldScopeObj, catalog.repo.gvc);
		const scopedCatalog = await catalog.repo.scopedCatalogs.getScopedCatalog(catalog.basePath, fs, commitScope);
		const scopedLogicPath = `${scopedCatalog.name}/${splitPath.slice(1).join("/")}`; // it's a correct way to get the logicPath for the article in scopedCatalog
		const scopedArticle = scopedCatalog.findArticle(scopedLogicPath, []);

		if (!scopedArticle) return null;
		const data = await dataProvider.getDiffArticlePage(scopedArticle, catalog, {
			scope,
			oldScope,
			scopedCatalog,
		});

		return data;
	},
});

export default getDiffModeArticlePageData;
