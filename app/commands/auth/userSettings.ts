import { ResponseKind } from "@app/types/ResponseKind";
import type UserSettings from "@app/types/UserSettings";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const userSettings: Command<{ ctx: Context; userSettings: UserSettings }, void> = Command.create({
	path: "auth/userSettings",

	kind: ResponseKind.none,

	async do({ ctx, userSettings }) {
		const { wm } = this._app;

		if (
			userSettings.workspace &&
			!wm.workspaces().find((workspace) => workspace.name === userSettings.workspace.name)
		) {
			const workspace: ClientWorkspaceConfig = {
				...userSettings.workspace,
				path: wm.defaultPath().join(new Path(userSettings.workspace.name)).toString(),
			};

			await this._commands.workspace.create.do({ config: workspace });
		}

		if (userSettings.storageData) {
			const sourceData = userSettings.storageData;

			if (sourceData.error) return console.log(sourceData.error);
			if (!(await makeSourceApi(sourceData, wm.current().config().services?.auth?.url).isCredentialsValid()))
				throw Error("Invalid creds");

			await this._commands.storage.setSourceData.do({ ctx, ...sourceData });
		}

		return;
	},

	params(ctx, q) {
		return {
			ctx,
			userSettings: JSON.parse(
				decodeURIComponent(Buffer.from(q.userSettings.replace("\\", "/"), "base64").toString()),
			),
		};
	},
});

export default userSettings;
