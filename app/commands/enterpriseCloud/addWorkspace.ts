import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { EnterpriseErrorCode } from "@ext/enterprise/errors/getEnterpriseErrors";
import type UserSettings from "@ext/enterprise/types/UserSettings";
import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import User from "@ext/security/logic/User/User";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const addWorkspace: Command<{ ctx: Context }, UserSettings> = Command.create({
	path: "enterpriseCloud/addWorkspace",

	kind: ResponseKind.json,

	async do({ ctx }) {
		const { wm, am, enterpriseCloudManager } = this._app;
		const gesCloudUrl = enterpriseCloudManager.getConfig().url;
		if (!gesCloudUrl) throw new DefaultError(t("enterprise.config-error"));

		const gesApi = new GesCloudApi(gesCloudUrl);
		const userSettings = await gesApi.getUserSettings();

		if (!userSettings) throw new DefaultError(t("enterprise.user-not-found"));
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

		const path = wm.defaultPath().parentDirectoryPath.join(new Path(userSettings.workspace.id)).toString();
		const existWorkspace = wm.workspaces().find((workspace) => workspace.path === path);

		if (existWorkspace && !existWorkspace.enterpriseCloud?.url) {
			throw new DefaultError(
				t("enterprise.workspace-exists"),
				null,
				{ errorCode: EnterpriseErrorCode.WorkspaceExist, workspacePath: existWorkspace.path },
				true,
				t("enterprise.workspace-exists-title"),
			);
		}

		const enterpriseWorkspace = userSettings.workspace;
		const workspaceConfig: ClientWorkspaceConfig = {
			path,
			id: enterpriseWorkspace.id,
			name: enterpriseWorkspace.name,
			icon: enterpriseWorkspace.icon,
			sections: enterpriseWorkspace.sections,
			services: enterpriseWorkspace.services,
			enterpriseCloud: {
				url: gesCloudUrl,
			},
		};

		if (!existWorkspace) await this._commands.workspace.create.do({ config: workspaceConfig });
		else await this._commands.workspace.edit.do({ data: { ...workspaceConfig } });

		const sourceData = userSettings.source;
		const userInfo: UserInfo = { mail: sourceData.userEmail, name: sourceData.userName, id: sourceData.userEmail };
		const user = new User(true, userInfo);
		am.setUser(ctx.cookie, user);

		return userSettings;
	},

	params(ctx) {
		return { ctx };
	},
});

export default addWorkspace;
