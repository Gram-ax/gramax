import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type UserSettings from "@ext/enterprise/types/UserSettings";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import assert from "assert";
import { Command } from "../../types/Command";

const cloneCatalogs: Command<{ ctx: Context; userSettings: UserSettings }, void> = Command.create({
	path: "enterprise/cloneCatalogs",

	kind: ResponseKind.none,

	async do({ ctx, userSettings }) {
		const source = userSettings.source;
		assert(source, "Source is required");
		const repos = userSettings.workspace?.git?.source?.repos ?? [];

		for (const repo of repos) {
			const split = repo.split("/");
			const name = split.pop();
			const group = split.join("/");
			await this._commands.storage.startClone.do({
				ctx,
				path: new Path(name),
				data: { source: source, group, name } as GitStorageData,
			});
		}
	},

	params(ctx, _, body) {
		return { ctx, userSettings: body };
	},
});

export default cloneCatalogs;
