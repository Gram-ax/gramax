import Path from "@core/FileProvider/Path/Path";
import { env, getExecutingEnvironment } from "../resolveModule/env";

interface AppConfigPaths {
	base: Path;
	root: Path;
	userDataPath: Path;
}

interface AppConfigServices {
	cors: { url: string };
	auth: { url: string };
	review: { url: string };
	diagramRenderer: { url: string };
	sso: { url: string; publicKey: string };
}

export interface AppConfig {
	version: string;

	isRelease: boolean;
	isReadOnly: boolean;
	isServerApp: boolean;
	isProduction: boolean;

	bugsnagApiKey: string;
	paths: AppConfigPaths;

	mail: { user: string; password: string };
	admin: { login: string; password: string };
	tokens: { share: string; cookie: string };
	services: AppConfigServices;
}

const getServices = (): AppConfigServices => {
	return {
		sso: {
			url: env("SSO_SERVICE_URL") ?? null,
			publicKey: env("SSO_SERVICE_PUBLIC_KEY") ?? null,
		},
		cors: {
			url: env("CORS_PROXY_SERVICE_URL") ?? "https://dev.gram.ax/-server/cors-proxy",
		},
		auth: {
			url: "https://app.gram.ax/-server/auth", // TODO: env("AUTH_SERVICE_URL") ?? "https://app.gram.ax/-server/auth",
		},
		diagramRenderer: {
			url: env("DIAGRAM_RENDERER_SERVICE_URL") ?? null,
		},
		review: {
			url: env("REVIEW_SERVICE_URL") ?? null,
		},
	};
};

const getPaths = (): AppConfigPaths => {
	if (getExecutingEnvironment() == "browser") {
		return {
			base: Path.empty,
			root: new Path("/mnt/docs"),
			userDataPath: new Path("/mnt/cache"),
		};
	}

	if (!env("ROOT_PATH")) {
		throw new Error(
			`Корневой каталог (${env(
				"ROOT_PATH",
			)}) не указан.\nСледуйте инструкциям, указанным в документации (https://docs.ics-it.ru/ics-docs/documentation/local/dev).`,
		);
	}

	const root = new Path(env("ROOT_PATH"));
	const userData = (env("USER_DATA_PATH") && new Path(env("USER_DATA_PATH"))) ?? root;

	return {
		base: new Path(env("BASE_PATH")),
		root,
		userDataPath: userData,
	};
};

export const getConfig = (): AppConfig => {
	if (global.config) return global.config;

	global.config = {
		paths: getPaths(),
		services: getServices(),

		version: env("GRAMAX_VERSION") ?? null,

		isReadOnly: env("READ_ONLY") === "true",
		isServerApp: env("SERVER_APP") === "true",
		isProduction: env("PRODUCTION") === "true",
		isRelease: (env("BRANCH") ?? "develop") == "master",

		bugsnagApiKey: env("BUGSNAG_API_KEY") ?? null,

		admin: {
			login: env("ADMIN_LOGIN") ?? null,
			password: env("ADMIN_PASSWORD") ?? null,
		},

		tokens: {
			share: env("SHARE_ACCESS_TOKEN") ?? null,
			cookie: env("COOKIE_SECRET") ?? null,
		},

		mail: {
			user: env("DOC_READER_MAIL"),
			password: env("DOC_READER_MAIL_PASSWORD"),
		},
	};

	return global.config;
};
