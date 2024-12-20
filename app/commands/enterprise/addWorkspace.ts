import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import UserSettings from "@ext/enterprise/types/UserSettings";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const addWorkspace: Command<{ token: string }, UserSettings> = Command.create({
	path: "enterprise/addWorkspace",

	kind: ResponseKind.json,

	async do({ token }) {
		const { wm, em } = this._app;
		if (!em.getConfig().gesUrl) throw new DefaultError(t("enterprise.config-error"));

		const userSettings = await new EnterpriseApi(em.getConfig().gesUrl).getUserSettings(token);
		if (userSettings.isNotEditor) {
			throw new DefaultError(
				t("enterprise.check-if-user-editor-warning"),
				null,
				{},
				true,
				t("enterprise.access-restricted"),
			);
		}

		if (!userSettings.workspace) throw new DefaultError(t("enterprise.config-error"));

		if (wm.workspaces().find((workspace) => workspace.name === userSettings.workspace.name))
			throw new DefaultError(t("enterprise.workspace-exists"));

		const workspace: ClientWorkspaceConfig = {
			...userSettings.workspace,
			path: wm.defaultPath().parentDirectoryPath.join(new Path(userSettings.workspace.name)).toString(),
		};

		await this._commands.workspace.create.do({ config: workspace });

		return userSettings;
	},

	params(_, q) {
		return { token: decodeURIComponent(q.token) };
	},
});

export default addWorkspace;
