import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import CustomLogoDriver from "@core/utils/CustomLogoDriver";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { EnterpriseErrorCode } from "@ext/enterprise/errors/getEnterpriseErrors";
import type UserSettings from "@ext/enterprise/types/UserSettings";
import type { ExportTemplate } from "@ext/enterprise/types/UserSettings";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import ClientAuthManager from "@ext/security/logic/ClientAuthManager";
import Permission from "@ext/security/logic/Permission/Permission";
import StrictPermissionMap from "@ext/security/logic/PermissionMap/StrictPermissionMap";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import Theme from "@ext/Theme/Theme";
import type { PdfTemplateManager } from "@ext/wordExport/PdfTemplateManager";
import type { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const hasTemplateBuffer = (template: { bufferBase64?: string | null }): template is { bufferBase64: string } =>
	typeof template.bufferBase64 === "string" && template.bufferBase64.length > 0;

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
			git: {
				lfs: enterpriseWorkspace.git?.lfs ?? enterpriseWorkspace.lfs,
			},
		};

		if (!existWorkspace) await this._commands.workspace.create.do({ config: workspaceConfig });
		else await this._commands.workspace.edit.do({ data: { ...workspaceConfig } });
		await wm.setWorkspace(path);

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
		if (am instanceof ClientAuthManager) {
			await am.forceUpdateEnterpriseUser(ctx.cookie, user);
		}

		await this._commands.storage.sourceData.setSourceData.do({ ctx, ...userSettings.source });

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

		const updateTemplates = async (
			exportTemplates: ExportTemplate[],
			templateManeger: PdfTemplateManager | WordTemplateManager,
		) => {
			const currentWorkspace = this._app.wm.current();
			const templates: { name: string; buffer: Buffer }[] = [];

			for (const template of exportTemplates) {
				if (!hasTemplateBuffer(template)) continue;
				templates.push({
					name: template.title,
					buffer: Buffer.from(template.bufferBase64, "base64"),
				});
			}

			if (templates.length) {
				await templateManeger.addTemplates(currentWorkspace, templates);
			}
		};

		if (userSettings.workspace.wordTemplates?.length) {
			await updateTemplates(userSettings.workspace.wordTemplates, this._app.wtm);
		}

		if (userSettings.workspace.pdfTemplates?.length) {
			await updateTemplates(userSettings.workspace.pdfTemplates, this._app.ptm);
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
