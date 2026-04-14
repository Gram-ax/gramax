import { getExecutingEnvironment } from "@app/resolveModule/env";
import type Context from "@core/Context/Context";
import type PageDataContext from "@core/Context/PageDataContext";
import getClientPermissions from "@ext/enterprise/utils/getClientPermissions";
import type UserInfo from "@ext/security/logic/User/UserInfo";
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

	return {
		theme: ctx.theme,
		domain: ctx.domain,
		isArticle,
		isLogged: ctx.user.isLogged,
		userInfo: userInfo || ctx.user.info || null,
		language: {
			ui: ctx.ui || null,
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
			search: conf.search,
			metrics: conf.metrics,
			version: conf.version,
			isRelease: conf.isRelease,
			basePath: conf.basePath.value,
			buildVersion: conf.buildVersion,
			isProduction: conf.isProduction,
			bugsnagApiKey: conf.bugsnagApiKey,
			forceUiLangSync: conf.forceUiLangSync,
			authServiceUrl: workspaceConfig?.services?.auth?.url || conf?.services?.auth?.url,
			cloudServiceUrl: workspaceConfig?.services?.cloud?.url || conf?.services?.cloud?.url,
			diagramsServiceUrl: workspaceConfig?.services?.diagramRenderer?.url || conf?.services?.diagramRenderer?.url,
			enterprise: app.em.getConfig(),
			ai: {
				enabled: Boolean(conf.portalAi.enabled || app.adp.getEditorAiData(ctx, workspace?.path() ?? "").apiUrl),
			},
		},
		permissions: getClientPermissions(ctx.user),
		features: getExecutingEnvironment() === "next" ? getEnabledFeatures().map((f) => f.name) : null,
	};
};

export default getPageDataContext;
