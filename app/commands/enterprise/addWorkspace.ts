import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import CustomLogoDriver from "@core/utils/CustomLogoDriver";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import UserSettings from "@ext/enterprise/types/UserSettings";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import Permission from "@ext/security/logic/Permission/Permission";
import RelaxPermissionMap from "@ext/security/logic/PermissionMap/RelaxPermissionMap";
import UserInfo from "@ext/security/logic/User/UserInfo";
import Theme from "@ext/Theme/Theme";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const addWorkspace: Command<{ ctx: Context; token: string }, UserSettings> = Command.create({
	path: "enterprise/addWorkspace",

	kind: ResponseKind.json,

	async do({ ctx, token }) {
		const { wm, em, am } = this._app;
		const gesUrl = em.getConfig().gesUrl;
		if (!gesUrl) throw new DefaultError(t("enterprise.config-error"));

		const userSettings = await new EnterpriseApi(gesUrl).getUserSettings(token);

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
			enterprise: {
				gesUrl,
				lastUpdateDate: Date.now(),
			},
			services: {
				gitProxy: { url: null },
				auth: { url: null },
				review: { url: null },
				diagramRenderer: { url: `${gesUrl}/diagram-renderer` },
			},
		};
		delete (workspace as any).style;

		await this._commands.workspace.create.do({ config: workspace });
		if (userSettings.ai) {
			await this._commands.ai.setAiData.do({ ctx, workspacePath: workspace.path, ...userSettings.ai });
		}

		const workspacePermission = new RelaxPermissionMap({ [workspace.path]: new Permission([]) });
		const catalogPermission = new RelaxPermissionMap({});
		const sourceData = userSettings.source;
		const userInfo: UserInfo = { mail: sourceData.userEmail, name: sourceData.userName, id: sourceData.userEmail };
		const user = new EnterpriseUser(
			true,
			userInfo,
			null,
			workspacePermission,
			catalogPermission,
			gesUrl,
			sourceData.token,
		);
		am.setUser(ctx.cookie, user);

		if (userSettings.workspace.style?.css) {
			await this._commands.workspace.assets.setCustomStyle.do({
				workspacePath: workspace.path,
				style: userSettings.workspace.style.css,
			});
		}
		if (userSettings.workspace.style?.logo) {
			await this._commands.workspace.assets.homeIconActions.updateLogo.do({
				workspacePath: workspace.path,
				theme: Theme.light,
				icon: CustomLogoDriver.logoToBase64(userSettings.workspace.style.logo),
			});
		}
		if (userSettings.workspace.style?.logoDark) {
			await this._commands.workspace.assets.homeIconActions.updateLogo.do({
				workspacePath: workspace.path,
				theme: Theme.dark,
				icon: CustomLogoDriver.logoToBase64(userSettings.workspace.style.logoDark),
			});
		}

		if (userSettings.workspace.wordTemplates?.length) {
			const currentWorkspace = this._app.wm.current();
			const templates = [];
			for (const template of userSettings.workspace.wordTemplates) {
				templates.push({
					name: template.title,
					buffer: Buffer.from(template.bufferBase64, "base64"),
				});
			}

			await this._app.wtm.addTemplates(currentWorkspace, templates);
		}

		return userSettings;
	},

	params(ctx, q) {
		return { ctx, token: decodeURIComponent(q.token) };
	},
});

export default addWorkspace;
