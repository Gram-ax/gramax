import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import { getWorkspaceGesUrl } from "@ext/enterprise/utils/getWorkspaceEnterpriseConfig";
import { PublishHealthcheckCode, type PublishHealthcheckResult } from "@ext/git/core/GitPublish/PublishHealthcheck";
import checkPublishHealth from "../../../core/extensions/git/core/GitPublish/logic/checkPublishHealth";
import { Command } from "../../types/Command";

const publishHealthcheck: Command<{ ctx: Context; catalogName: string }, PublishHealthcheckResult> = Command.create({
	path: "storage/publishHealthcheck",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return { code: PublishHealthcheckCode.Ok };

		const workspaceConfig = await workspace.config();
		return checkPublishHealth(this._app, ctx, catalog, getWorkspaceGesUrl(workspaceConfig));
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default publishHealthcheck;
