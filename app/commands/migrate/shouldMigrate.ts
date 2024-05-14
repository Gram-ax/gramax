import { getExecutingEnvironment } from "@app/resolveModule/env";
import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";

const shouldMigrate: Command<void, boolean> = Command.create({
	path: "migrate/migrate",

	kind: ResponseKind.json,

	async do() {
		const fp = this._app.lib.getFileProvider();
		return (
			this._app.obsoleteFp &&
			getExecutingEnvironment() === "browser" &&
			(await this._app.obsoleteFp.shouldMigrate(fp))
		);
	},

	params() {},
});

export default shouldMigrate;
