import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import type { CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { Command } from "../../types/Command";

const getCloneProgress: Command<{ path: Path }, CloneProgress> = Command.create({
	path: "storage/getCloneProgress",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	do({ path }) {
		return this._app.rp.getCloneProgress(path);
	},

	params(_, q, body) {
		return { path: new Path(q.path), data: body };
	},
});

export default getCloneProgress;
