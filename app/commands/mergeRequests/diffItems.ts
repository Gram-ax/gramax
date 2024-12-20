import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitDiffItemCreatorRevisions from "@ext/git/core/GitDiffItemCreator/revisions/GitDiffItemCreatorRevisions";
import t from "@ext/localization/locale/translate";
import { Command } from "../../types/Command";

const diffItems: Command<
	{ catalogName: string; ctx: Context; sourceBranch: string; targetBranch: string },
	{ items: DiffItem[]; resources: DiffResource[] }
> = Command.create({
	path: "mergeRequests/diffItems",

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

		const gitDiffItemCreator = new GitDiffItemCreatorRevisions(
			catalog,
			sitePresenterFactory.fromContext(ctx),
			fs,
			oldRef,
			newRef,
			articleParser,
		);

		const diffItems = await gitDiffItemCreator.getDiffItems();
		if (diffItems.items.length == 0 && diffItems.resources.length == 0) {
			throw new DefaultError(
				t("git.merge-requests.warning.no-changes.body"),
				null,
				null,
				true,
				t("git.merge-requests.warning.no-changes.title"),
			);
		}
		return diffItems;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const sourceBranch = q.sourceBranch;
		const targetBranch = q.targetBranch;
		return { ctx, catalogName, sourceBranch, targetBranch };
	},
});

export default diffItems;
