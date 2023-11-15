import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Command, ResponseKind } from "../../types/Command";

const vscode: Command<{ path: string }, string> = Command.create({
	path: "vscode",

	kind: ResponseKind.redirect,

	middlewares: [new DesktopModeMiddleware()],

	async do({ path }) {
		const name = path.split("/")[0];
		const catalog = await this._app.lib.getCatalog(name);
		const fp = this._app.lib.getFileProviderByCatalog(catalog);
		return "vscode://file/" + fp.rootPath.join(new Path(path)).value;
	},

	params(ctx, q) {
		return { ctx, path: q.path };
	},
});

export default vscode;
