import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import { IconEditorProps } from "@ext/markdown/elements/icon/logic/IconProvider";

const create: Command<{ ctx: Context; catalogName: string; iconEditorProps: IconEditorProps }, string> = Command.create(
	{
		path: "elements/icon/create",

		kind: ResponseKind.json,

		middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, iconEditorProps }) {
			const { wm } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;
			return await catalog.customProviders.iconProvider.create(iconEditorProps);
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			return { ctx, catalogName, iconEditorProps: body };
		},
	},
);

export default create;
