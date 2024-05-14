import { getExecutingEnvironment } from "@app/resolveModule/env";
import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";

const migrate: Command<{ onProgress: (n: number) => any; onIgnore: (name: string) => any }, void> = Command.create({
	path: "migrate/migrate",

	kind: ResponseKind.none,

	async do({ onProgress, onIgnore }) {
		if (getExecutingEnvironment() !== "browser") return;
		await this._app.obsoleteFp.migrate(this._app.lib.getFileProvider(), onProgress, onIgnore);
	}
});

export default migrate;
