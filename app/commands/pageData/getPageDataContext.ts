import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import getClientPermissions from "@ext/enterprise/utils/getClientPermissions";
import UserInfo from "@ext/security/logic/User/UserInfo";
import Application from "../../types/Application";
import { getExecutingEnvironment } from "@app/resolveModule/env";

const getPageDataContext = async ({
	ctx,
	app,
	isArticle,
	userInfo,
	isReadOnly,
}: {
	ctx: Context;
	app: Application;
	isArticle: boolean;
	userInfo?: UserInfo;
	isReadOnly?: boolean;
}): Promise<PageDataContext> => {
	const conf = app.conf;
	const workspace = app.wm.maybeCurrent();
	const workspaceConfig = await workspace?.config();
	const isStatic = getExecutingEnvironment() === "static";

	const enterpriseConfig = app.em.getConfig();
	const isGramaxAiEnabled = Boolean(
		conf.portalAi.enabled || app.adp.getEditorAiData(ctx, workspace?.path() ?? "").apiUrl,
	);

	return {
		language: {
			content: ctx.contentLanguage ?? null,
			ui: ctx.ui ?? null,
		},
		theme: ctx.theme,
		domain: ctx.domain,
		isLogged: !isStatic && ctx.user.isLogged,
		sourceDatas: app.rp.getSourceDatas(ctx) ?? [],
		isArticle,
		workspace: {
			workspaces: app.wm.workspaces(),
			current: workspace?.path(),
			defaultPath: app.wm.defaultPath().value,
		},
		conf: {
			isReadOnly,
			version: conf.version,
			isRelease: conf.isRelease,
			basePath: conf.basePath.value,
			buildVersion: conf.buildVersion,
			isProduction: conf.isProduction,
			bugsnagApiKey: conf.bugsnagApiKey,
			metrics: conf.metrics,
			authServiceUrl: workspaceConfig?.services?.auth?.url || conf.services.auth.url,
			cloudServiceUrl: workspaceConfig?.services?.cloud?.url || conf.services.cloud.url,
			diagramsServiceUrl: workspaceConfig?.services?.diagramRenderer?.url || conf.services.diagramRenderer.url,
			enterprise: enterpriseConfig,
			logo: app.conf.logo,
			search: app.conf.search,
			ai: { enabled: isGramaxAiEnabled },
		},
		userInfo: userInfo ?? ctx.user.info ?? null,
		permissions: getClientPermissions(ctx.user),
	};
};

export default getPageDataContext;
