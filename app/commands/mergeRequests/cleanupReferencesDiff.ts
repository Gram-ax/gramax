import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { Command } from "../../types/Command";

const cleanupReferencesDiff: Command<{ catalogName: string; sourceBranch: string; targetBranch: string }, void> =
	Command.create({
		path: "mergeRequests/cleanupReferencesDiff",

		kind: ResponseKind.none,

		middlewares: [new AuthorizeMiddleware()],

		async do({ catalogName, sourceBranch, targetBranch }) {
			const workspace = this._app.wm.current();

			const catalog = await workspace.getContextlessCatalog(catalogName);

			if (!catalog || !catalog.repo.storage) return;
			const fs = workspace.getFileStructure();

			catalog.repo.scopedCatalogs.unmountScopes(
				catalog.basePath,
				fs.fp,
				{ reference: targetBranch },
				{ reference: sourceBranch },
			);
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const sourceBranch = q.sourceBranch;
			const targetBranch = q.targetBranch;
			return { ctx, catalogName, sourceBranch, targetBranch };
		},
	});

export default cleanupReferencesDiff;
