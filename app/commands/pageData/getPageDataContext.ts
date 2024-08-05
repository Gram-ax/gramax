import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import UserInfo from "@ext/security/logic/User/UserInfo2";
import Application from "../../types/Application";

const getPageDataContext = ({
	ctx,
	app,
	isArticle,
	userInfo,
}: {
	ctx: Context;
	app: Application;
	isArticle: boolean;
	userInfo?: UserInfo;
}): PageDataContext => {
	return {
		lang: ctx.lang,
		theme: ctx.theme,
		domain: ctx.domain,
		userInfo: userInfo ?? ctx.user.info ?? null,
		isLogged: ctx.user.isLogged,
		sourceDatas: app.rp.getSourceDatas(ctx.cookie) ?? [],
		isArticle,
		workspace: {
			workspaces: app.wm.workspaces(),
			current: app.wm.maybeCurrent()?.path(),
			defaultPath: app.wm.defaultPath().value,
			isEnterprise: app.wm.maybeCurrent()?.config().isEnterprise,
		},
		conf: {
			isRelease: app.conf.isRelease,
			version: app.conf.version,
			buildVersion: app.conf.buildVersion,
			basePath: app.conf.basePath.value,
			isReadOnly: app.conf.isReadOnly,
			isServerApp: app.conf.isServerApp,
			isProduction: app.conf.isProduction,
			bugsnagApiKey: app.conf.bugsnagApiKey,
			glsUrl: app.conf.glsUrl,
			ssoServerUrl: app.wm.maybeCurrent()?.config?.()?.services?.sso?.url,
			authServiceUrl: app.wm.maybeCurrent()?.config?.()?.services?.auth?.url,
			yandexMetricCounter: app.conf.yandexMetricCounter,
		},
	};
};

export default getPageDataContext;
