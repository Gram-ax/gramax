import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Command } from "../../types/Command";

const cancelClone: Command<{ path: Path }, void> = Command.create({
	path: "storage/cancelClone",

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ path }) {
		const workspace = await this._app.wm.currentOrDefault();
		const { rp } = this._app;
		const fs = workspace.getFileStructure();
		await rp.cancelClone(fs, path);
	},

	params(_, q) {
		return {
			path: new Path(q.path),
		};
	},
});

export default cancelClone;
