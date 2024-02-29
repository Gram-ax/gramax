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
		conf: {
			branch: app.conf.branch,
			version: app.conf.gramaxVersion,
			basePath: app.conf.basePath.value,
			isReadOnly: app.conf.isReadOnly,
			isServerApp: app.conf.isServerApp,
			ssoServerUrl: app.conf.ssoServerUrl,
			ssoPublicKey: app.conf.ssoPublicKey,
			authServiceUrl: app.conf.authServiceUrl,
			isProduction: app.conf.isProduction,
			enterpriseServerUrl: app.conf.enterpriseServerUrl,
			bugsnagApiKey: app.conf.bugsnagApiKey,
		},
	};
};

export default getPageDataContext;
