import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Command } from "../../types/Command";

const vscode: Command<{ path: Path }, string> = Command.create({
	path: "vscode",

	kind: ResponseKind.redirect,

	middlewares: [new DesktopModeMiddleware()],

	do({ path }) {
		return "vscode://file/" + this._app.wm.current().getFileProvider().rootPath.join(path).value;
	},

	params(ctx, q) {
		return { ctx, path: new Path(q.path) };
	},
});

export default vscode;
