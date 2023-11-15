import { AppConfig, getPaths } from "../config/AppConfig";
import { env } from "../resolveModule";

const configure = (): AppConfig => {
	if (global.config) return global.config;

	global.config = {
		isServerApp: env("SERVER_APP") === "true",
		isProduction: env("PRODUCTION") === "true",
		isReadOnly: env("READ_ONLY_MODE") === "true",
		enterpriseServerUrl: env("ENTERPRISE_SERVER_URL") ?? null,
		bugsnagApiKey: env("BUGSNAG_API_KEY") ?? null,
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
	};

	return global.config;
};

export default configure;
