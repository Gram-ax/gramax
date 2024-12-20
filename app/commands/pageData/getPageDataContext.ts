import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import getClientPermissions from "@ext/enterprise/utils/getClientPermissions";
import UserInfo from "@ext/security/logic/User/UserInfo";
import Application from "../../types/Application";

const getPageDataContext = ({
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
}): PageDataContext => {
	const conf = app.conf;
	const workspace = app.wm.maybeCurrent();
	const workspaceConfig = workspace?.config?.();
	return {
		language: {
			content: ctx.contentLanguage ?? null,
			ui: ctx.ui ?? null,
		},
		theme: ctx.theme,
		domain: ctx.domain,
		isLogged: ctx.user.isLogged,
		sourceDatas: app.rp.getSourceDatas(ctx.cookie) ?? [],
		isArticle,
		workspace: {
			workspaces: app.wm.workspaces(),
			current: workspace?.path(),
			defaultPath: app.wm.defaultPath().value,
			isEnterprise: workspaceConfig?.isEnterprise,
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
			diagramsServiceUrl: workspaceConfig?.services?.diagramRenderer?.url || conf.services.diagramRenderer.url,
			enterprise: app.em.getConfig(),
			logo: app.conf.logo,
		},
		userInfo: userInfo ?? ctx.user.info ?? null,
		permissions: getClientPermissions(ctx.user),
	};
};

export default getPageDataContext;
