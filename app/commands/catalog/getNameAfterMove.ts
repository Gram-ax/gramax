import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import { uniqueNameWithIndex } from "@core/utils/uniqueName";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import assert from "assert";
import { Command } from "../../types/Command";

const getNameAfterMove: Command<
	{ ctx: Context; desiredDirName: string; to: WorkspacePath },
	{ resolvedDirName: string; idx: number; exists: boolean }
> = Command.create({
	path: "catalog/getNameAfterMove",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ desiredDirName, to }) {
		const { wm } = this._app;

		assert(to, `you should provide a target workspace; got ${to}`);

		const w = await wm.getUnintializedWorkspace(to);
		assert(w, `workspace not found: ${to}`);

		const [resolvedDirName, idx] = uniqueNameWithIndex(desiredDirName, w.getCatalogDirNames());
		return { resolvedDirName, idx, exists: resolvedDirName !== desiredDirName };
	},

	params(ctx, q) {
		const desiredName = q.desiredName;
		const to = q.to;
		return { ctx, desiredDirName: desiredName, to };
	},
});

export default getNameAfterMove;
