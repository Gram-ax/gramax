import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import CustomLogoDriver from "@core/utils/CustomLogoDriver";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { EnterpriseErrorCode } from "@ext/enterprise/errors/getEnterpriseErrors";
import type UserSettings from "@ext/enterprise/types/UserSettings";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import Permission from "@ext/security/logic/Permission/Permission";
import StrictPermissionMap from "@ext/security/logic/PermissionMap/StrictPermissionMap";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import Theme from "@ext/Theme/Theme";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const addWorkspace: Command<{ ctx: Context; oneTimeCode: string }, UserSettings> = Command.create({
	path: "enterprise/addWorkspace",

	kind: ResponseKind.json,

	async do({ ctx, oneTimeCode }) {
		const { wm, em, am } = this._app;
		const enterpriseConfig = em.getConfig();
		const gesUrl = enterpriseConfig.gesUrl;
		if (!gesUrl) throw new DefaultError(t("enterprise.config-error"));

		const gesApi = new EnterpriseApi(gesUrl);
		const token = await gesApi.getToken(oneTimeCode);
		if (!token) throw new DefaultError(t("enterprise.token-exchange-failed"));
		const userSettings = await gesApi.getUserSettings(token);

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

		if (existWorkspace && !existWorkspace.enterprise?.gesUrl) {
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
			enterprise: {
				gesUrl: enterpriseConfig.gesUrl,
				modules: userSettings.workspace.modules,
				lastUpdateDate: Date.now(),
				refreshInterval: enterpriseConfig.refreshInterval,
			},
		};

		if (!existWorkspace) await this._commands.workspace.create.do({ config: workspaceConfig });
		else await this._commands.workspace.edit.do({ data: { ...workspaceConfig } });

		const workspacePermission = new StrictPermissionMap({ [path]: new Permission([]) });
		const catalogPermission = new StrictPermissionMap({});
		const sourceData = userSettings.source;
		const userInfo: UserInfo = { mail: sourceData.userEmail, name: sourceData.userName, id: sourceData.userEmail };
		const user = new EnterpriseUser(
			true,
			userInfo,
			null,
			workspacePermission,
			catalogPermission,
			enterpriseConfig,
			sourceData.token,
		);
		am.setUser(ctx.cookie, user);

		if (userSettings.ai) {
			await this._commands.ai.server.setAiData.do({ ctx, workspacePath: path, ...userSettings.ai });
		}

		if (userSettings.workspace.style?.css) {
			await this._commands.workspace.assets.setCustomStyle.do({
				workspacePath: path,
				style: userSettings.workspace.style.css,
			});
		}
		if (userSettings.workspace.style?.logo) {
			await this._commands.workspace.assets.homeIconActions.updateLogo.do({
				workspacePath: path,
				theme: Theme.light,
				icon: CustomLogoDriver.logoToBase64(userSettings.workspace.style.logo),
			});
		}
		if (userSettings.workspace.style?.logoDark) {
			await this._commands.workspace.assets.homeIconActions.updateLogo.do({
				workspacePath: path,
				theme: Theme.dark,
				icon: CustomLogoDriver.logoToBase64(userSettings.workspace.style.logoDark),
			});
		}

		if (userSettings.workspace.wordTemplates?.length) {
			const currentWorkspace = this._app.wm.current();
			const templates: { name: string; buffer: Buffer }[] = [];
			for (const template of userSettings.workspace.wordTemplates) {
				templates.push({
					name: template.title,
					buffer: Buffer.from(template.bufferBase64, "base64"),
				});
			}

			await this._app.wtm.addTemplates(currentWorkspace, templates);
		}

		if (userSettings.workspace.pdfTemplates?.length) {
			const currentWorkspace = this._app.wm.current();

			const templates: { name: string; buffer: Buffer }[] = [];
			for (const template of userSettings.workspace.pdfTemplates) {
				templates.push({
					name: template.title,
					buffer: Buffer.from(template.bufferBase64, "utf-8"),
				});
			}

			await this._app.ptm.addTemplates(currentWorkspace, templates);
		}

		if (userSettings.workspace.modules) {
			await this._commands.enterprise.modules.set.do({
				workspacePath: path,
				modules: userSettings.workspace.modules,
			});
		}

		if (userSettings.workspace.plugins?.length) {
			const assets = wm.getWorkspaceAssets(path);
			await userSettings.workspace.plugins.forEachAsync(async (plugin) => {
				await assets.plugins.addFromConfig(plugin);
			});
		}

		return userSettings;
	},

	params(ctx, q) {
		return { ctx, oneTimeCode: decodeURIComponent(q.oneTimeCode) };
	},
});

export default addWorkspace;
