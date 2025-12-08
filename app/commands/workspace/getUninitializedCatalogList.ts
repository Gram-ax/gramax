import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import type { CatalogSummary } from "@ext/workspace/UnintializedWorkspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const getUninitializedCatalogList: Command<
	{ ctx: Context; workspacePath: WorkspacePath },
	{ catalogSummary: CatalogSummary[] }
> = Command.create({
	path: "workspace/getUninitializedCatalogList",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ workspacePath }) {
		const workspace = await this._app.wm.getUnintializedWorkspace(workspacePath);

		return { catalogSummary: await workspace.getCatalogSummary() };
	},

	params(ctx, q) {
		return { ctx, workspacePath: q.workspacePath };
	},
});

export default getUninitializedCatalogList;
