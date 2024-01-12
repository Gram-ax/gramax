import { AppConfig, getPaths } from "../config/AppConfig";
import { env } from "../resolveModule";

const configure = (): AppConfig => {
	if (global.config) return global.config;

	global.config = {
		isReadOnly: env("READ_ONLY") == "true",
		isServerApp: env("SERVER_APP") == "true",
		isProduction: env("PRODUCTION") == "true",
		branch: env("BRANCH") ?? "develop",
		ssoServerUrl: env("SSO_SERVER_URL") ?? null,
		ssoPublicKey: env("SSO_PUBLIC_KEY") ?? null,
		enterpriseServerUrl: env("ENTERPRISE_SERVER_URL") ?? null,
		bugsnagApiKey: env("BUGSNAG_API_KEY") ?? null,
		cookieSecret: env("COOKIE_SECRET") ?? null,
		adminLogin: env("ADMIN_LOGIN") ?? null,
		adminPassword: env("ADMIN_PASSWORD") ?? null,
		gramaxVersion: env("GRAMAX_VERSION") ?? null,

		tokens: {
			share: env("SHARE_ACCESS_TOKEN"),
		},

		paths: getPaths(),

		mail: {
			user: env("DOC_READER_MAIL"),
			password: env("DOC_READER_MAIL_PASSWORD"),
		},
	} as AppConfig;

	return global.config;
};

export default configure;
