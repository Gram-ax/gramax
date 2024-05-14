import { getExecutingEnvironment } from "@app/resolveModule/env";
import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";

const migrate: Command<void, number> = Command.create({
	path: "migrate/countFiles",

	kind: ResponseKind.json,

	async do() {
		if (getExecutingEnvironment() !== "browser") return;
		return await this._app.obsoleteFp.countAllFiles();
	},
});

export default migrate;
