import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import setWorkerProxy from "../../../apps/browser/src/logic/setWorkerProxy";
import { Command } from "../../types/Command";

const setDefaultPath: Command<{ path: Path }, void> = Command.create({
	path: "workspace/setDefaultPath",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware()],

	async do({ path }) {
		const { wm } = this._app;
		const workspacePath = await wm.addWorkspace(path.value, null, true, true);
		if (!workspacePath) return this._app.wm.setDefaultPath(path);
		await wm.setWorkspace(workspacePath);
		// TODO: Remove if
		if (getExecutingEnvironment() == "browser") setWorkerProxy(wm.current().config().services?.gitProxy?.url);
	},

	params(ctx, q) {
		return { path: new Path(q.path) };
	},
});

export default setDefaultPath;
