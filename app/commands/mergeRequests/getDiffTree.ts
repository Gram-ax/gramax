import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import RevisionDiffItemCreator from "@ext/git/core/GitDiffItemCreator/RevisionDiffItemCreator";
import RevisionDiffTreePresenter, { type DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import Navigation from "@ext/navigation/catalog/main/logic/Navigation";
import { Command } from "../../types/Command";

export type MergeRequestDiffTree = {
	diffTree: DiffTree;
	sourceBranchRef: string;
	targetBranchRef: string;
};

const getDiffTree: Command<
	{ catalogName: string; ctx: Context; sourceBranch: string; targetBranch: string },
	MergeRequestDiffTree
> = Command.create({
	path: "mergeRequests/diffTree",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, ctx, sourceBranch, targetBranch }) {
		const { sitePresenterFactory, wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);

		if (!catalog || !catalog.repo.storage) return;

		const fs = workspace.getFileStructure();
		const gvc = catalog.repo.gvc;
		const oldRef = await gvc.getHeadCommit(targetBranch);
		const newRef = await gvc.getHeadCommit(sourceBranch);

		const articleParser = new ArticleParser(ctx, parser, parserContextFactory);

		const catalogPath = catalog.basePath;
		const scopedCatalogs = catalog.repo.scopedCatalogs;

		const oldCatalog = await scopedCatalogs.getScopedCatalog(catalogPath, fs, { reference: targetBranch }, false);
		const newCatalog = await scopedCatalogs.getScopedCatalog(catalogPath, fs, { reference: sourceBranch }, false);

		const gitDiffItemCreator = new RevisionDiffItemCreator(
			catalog,
			sitePresenterFactory.fromContext(ctx),
			fs,
			{
				type: "tree",
				old: oldRef,
				new: newRef,
			},
			oldCatalog,
			newCatalog,
			articleParser,
		);

		const nav = new Navigation();

		const diffTreePresenter = new RevisionDiffTreePresenter({
			diffItems: await gitDiffItemCreator.getDiffItems(),
			newRoot: newCatalog.name,
			oldRoot: oldCatalog.name,
			newItems: await nav.getCatalogNav(newCatalog, null),
			oldItems: await nav.getCatalogNav(oldCatalog, null),
		});

		const diffTree = diffTreePresenter.present();
		return { diffTree, targetBranchRef: oldRef.toString(), sourceBranchRef: newRef.toString() };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const sourceBranch = q.sourceBranch;
		const targetBranch = q.targetBranch;
		return { ctx, catalogName, sourceBranch, targetBranch };
	},
});
export default getDiffTree;
