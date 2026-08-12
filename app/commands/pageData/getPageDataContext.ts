import { getExecutingEnvironment } from "@app/resolveModule/env";
import type Context from "@core/Context/Context";
import type PageDataContext from "@core/Context/PageDataContext";
import getClientPermissions from "@ext/enterprise/utils/getClientPermissions";
import { getWorkspaceEnterpriseConfig } from "@ext/enterprise/utils/getWorkspaceEnterpriseConfig";
import UiLanguage from "@ext/localization/core/model/Language";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import { YamlSettingsStore } from "@ext/settings/logic/SettingsStore";
import { getEnabledFeatures } from "@ext/toggleFeatures/features";
import type Application from "../../types/Application";

type GetPageDataContext = (args: {
	ctx: Context;
	app: Application;
	isArticle: boolean;
	userInfo?: UserInfo;
	isReadOnly?: boolean;
}) => Promise<PageDataContext>;

const getPageDataContext: GetPageDataContext = async ({ ctx, app, isArticle, userInfo, isReadOnly }) => {
	const conf = app.conf;
	const workspace = app.wm.maybeCurrent();
	const workspaceConfig = await workspace?.config();
	const enterpriseConfig = getWorkspaceEnterpriseConfig(workspaceConfig);

	// Overrides only (env + stored, no schema defaults): the client computes
	// its own defaults — browser locale and OS theme are invisible to this realm.
	const effectiveSettings = workspace
		? app.settings.resolveWorkspace(new YamlSettingsStore(workspace.yaml()), { includeDefaults: false })
		: app.settings.resolveApp({ includeDefaults: false });

	const uiLang = conf.forceUiLangSync && ctx.contentLanguage ? UiLanguage[ctx.contentLanguage] || ctx.ui : ctx.ui;
	if (uiLang || ctx.theme) {
		effectiveSettings.general = {
			...effectiveSettings.general,
			...(uiLang ? { language: uiLang } : {}),
			...(ctx.theme ? { theme: ctx.theme } : {}),
		};
	}

	return {
		settings: effectiveSettings,
		// The app-level layer alone (no workspace overrides): the settings modal
		// needs it to show/reset App-tab values that `settings` (workspace-effective)
		// would mask — see useHydrateSettings/hydrateApp.
		appSettings: app.settings.resolveApp({ includeDefaults: false }),
		domain: ctx.domain,
		isArticle,
		isLogged: ctx.user.isLogged,
		userInfo: userInfo || ctx.user.info || null,
		language: {
			content: ctx.contentLanguage || null,
		},
		workspace: {
			current: workspace?.path(),
			workspaces: app.wm.workspaces(),
			defaultPath: app.wm.defaultPath().value,
		},
		pdfTemplates: (await app.ptm.from(workspace))?.getTemplates() ?? [],
		wordTemplates: (await app.wtm.from(workspace))?.getTemplates() ?? [],
		conf: {
			isReadOnly,
			logo: conf.logo,
			search: { resourcesEnabled: app.conf.search.resourceSearchEnabled },
			metrics: conf.metrics,
			version: conf.version,
			isRelease: conf.isRelease,
			basePath: conf.basePath.value,
			buildVersion: conf.buildVersion,
			isProduction: conf.isProduction,
			bugsnagApiKey: conf.bugsnagApiKey,
			forceUiLangSync: conf.forceUiLangSync,
			cloudServiceUrl: conf?.services?.cloud?.url,
			enterprise: enterpriseConfig,
			activeGesUrl: app.em.getConfig().gesUrl,
			ai: {
				enabled: Boolean(conf.portalAi.enabled || app.adp.getEditorAiData(ctx, workspace?.path() ?? "").apiUrl),
			},
			enterpriseCloud: app.enterpriseCloudManager.getConfig(),
		},
		permissions: getClientPermissions(ctx.user),
		features: getExecutingEnvironment() === "next" ? getEnabledFeatures().map((f) => f.name) : null,
	};
};

export default getPageDataContext;
