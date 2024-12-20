import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import UserSettings from "@ext/enterprise/types/UserSettings";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import { Command } from "../../types/Command";

const cloneCatalogs: Command<{ ctx: Context; userSettings: UserSettings }, void> = Command.create({
	path: "enterprise/cloneCatalogs",

	kind: ResponseKind.none,

	async do({ ctx, userSettings }) {
		const { wm } = this._app;

		if (!userSettings.source) throw Error(t("enterprise.config-error"));

		const sourceData = userSettings.source;
		const authUrl = wm.current().config().services?.auth?.url;
		if (!(await makeSourceApi(sourceData, authUrl).isCredentialsValid())) throw Error(t("enterprise.config-error"));

		await this._commands.storage.setSourceData.do({ ctx, ...sourceData });

		if (!userSettings.workspace.source || !userSettings.source) return;

		for (const repo of userSettings.workspace.source?.repos ?? []) {
			const split = repo.split("/");
			const name = split.pop();
			const group = split.join("/");
			await this._commands.storage.startClone.do({
				path: new Path(name),
				data: { source: userSettings.source, group, name } as GitStorageData,
			});
		}
	},

	params(ctx, _, body) {
		return { ctx, userSettings: body };
	},
});

export default cloneCatalogs;
