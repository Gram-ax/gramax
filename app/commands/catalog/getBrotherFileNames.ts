import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import { Command } from "../../types/Command";

const getBrotherFileNames: Command<{ catalogName: string }, string[]> = Command.create({
	path: "catalog/getBrotherFileNames",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	do({ catalogName }) {
		const { lib } = this._app;
		return Array.from(lib.getCatalogEntries().keys()).filter((n) => n !== catalogName);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getBrotherFileNames;
