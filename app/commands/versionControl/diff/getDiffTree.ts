import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import DiffTreeCreator from "@ext/git/core/DiffTreeCreator/DiffTreeCreator";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { type DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import assert from "assert";

const getDiffTree: Command<
	{ catalogName: string; ctx: Context; oldScope: TreeReadScope; newScope?: TreeReadScope },
	DiffTree
> = Command.create({
	path: "versionControl/diff/getDiffTree",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, ctx, oldScope, newScope }) {
		const { sitePresenterFactory, wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog);

		const fs = workspace.getFileStructure();
		const articleParser = new ArticleParser(ctx, parser, parserContextFactory);

		const diffTreeCreator = new DiffTreeCreator(
			articleParser,
			fs,
			sitePresenterFactory.fromContext(ctx),
			catalog,
			oldScope,
			newScope,
		);

		return diffTreeCreator.getDiffTree();
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const oldScope = JSON.parse(q.oldScope);
		const newScope = q.newScope ? JSON.parse(q.newScope) : undefined;
		return { ctx, catalogName, oldScope, newScope };
	},
});

export default getDiffTree;
