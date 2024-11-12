import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const initEnterprise: Command<{ ctx: Context; token: string }, void> = Command.create({
	path: "auth/initEnterprise",

	kind: ResponseKind.none,

	async do({ ctx, token }) {
		const { wm, conf } = this._app;
		if (!conf.enterprise.gesUrl) throw new DefaultError(t("enterprise.config-not-found"));

		const userSettings = await new EnterpriseApi(conf.enterprise.gesUrl).getUserSettings(token);
		if (userSettings.isNotEditor) {
			throw new DefaultError(
				t("enterprise.check-if-user-editor-warning"),
				null,
				{},
				true,
				t("enterprise.access-restricted"),
			);
		}

		if (
			userSettings.workspace &&
			!wm.workspaces().find((workspace) => workspace.name === userSettings.workspace.name)
		) {
			const workspace: ClientWorkspaceConfig = {
				...userSettings.workspace,
				path: wm.defaultPath().parentDirectoryPath.join(new Path(userSettings.workspace.name)).toString(),
			};

			await this._commands.workspace.create.do({ config: workspace });
		}

		if (userSettings.source) {
			const sourceData = userSettings.source;
			const authUrl = wm.current().config().services?.auth?.url;
			if (!(await makeSourceApi(sourceData, authUrl).isCredentialsValid())) {
				throw Error("Invalid creds");
			}
			await this._commands.storage.setSourceData.do({ ctx, ...sourceData });
		}

		if (userSettings.workspace.source && userSettings.source) {
			for (const repo of userSettings.workspace.source?.repos ?? []) {
				const [group, name] = repo.split("/");
				await this._commands.storage.startClone.do({
					path: new Path(name),
					data: { source: userSettings.source, group, name } as GitStorageData,
				});
			}
		}

		return;
	},

	params(ctx, q) {
		return { ctx, token: decodeURIComponent(q.token) };
	},
});

export default initEnterprise;
