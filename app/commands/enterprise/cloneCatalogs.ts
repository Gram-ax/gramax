import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import UserSettings from "@ext/enterprise/types/UserSettings";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import { Command } from "../../types/Command";

const cloneCatalogs: Command<{ ctx: Context; userSettings: UserSettings }, void> = Command.create({
	path: "enterprise/cloneCatalogs",

	kind: ResponseKind.none,

	async do({ ctx, userSettings }) {
		const source = userSettings.source;
		if (!source) throw new DefaultError(t("enterprise.config-error"));

		await this._commands.storage.setSourceData.do({ ctx, ...source });

		if (!userSettings.workspace.source || !source) return;

		for (const repo of userSettings.workspace.source?.repos ?? []) {
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
