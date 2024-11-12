import Path from "@core/FileProvider/Path/Path";
import type { WorkspaceManagerConfig } from "@ext/workspace/WorkspaceManager";
import { env, getExecutingEnvironment } from "../resolveModule/env";

export type AppGlobalConfig = WorkspaceManagerConfig;

interface AppConfigPaths {
	base: Path;
	root: Path;
	data: Path;
	default: Path;
}

export interface ServicesConfig {
	gitProxy: { url: string };
	auth: { url: string };
	review: { url: string };
	diagramRenderer: { url: string };
}

export interface EnterpriseConfig {
	gesUrl: string;
}

export type AppConfig = {
	version: string;
	buildVersion: string;

	isRelease: boolean;
	isReadOnly: boolean;
	isProduction: boolean;
	disableSeo: boolean;

	bugsnagApiKey: string;
	yandexMetricCounter: string;
	paths: AppConfigPaths;

	mail: { user: string; password: string };
	admin: { login: string; password: string };
	tokens: { share: string; cookie: string };
	services: ServicesConfig;
	enterprise: EnterpriseConfig;

	logo: { imageUrl: string; linkUrl: string; linkTitle: string };
};

const getServices = (): ServicesConfig => {
	return {
		gitProxy: {
			url: env("GIT_PROXY_SERVICE_URL") ?? "https://develop.gram.ax/git-proxy",
		},
		auth: {
			url: env("AUTH_SERVICE_URL") ?? "https://gram.ax/auth",
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
			data: new Path("/mnt/data"),
			default: new Path("/mnt/default"),
		};
	}

	const root = env("ROOT_PATH") && new Path(env("ROOT_PATH"));
	const userData = (env("USER_DATA_PATH") && new Path(env("USER_DATA_PATH"))) ?? root;

	return {
		base: new Path(env("BASE_PATH")),
		root,
		data: userData,
		default: new Path(env("GRAMAX_DEFAULT_WORKSPACE_PATH")),
	};
};

export const getConfig = (): AppConfig => {
	if (global.config) return global.config;

	global.config = {
		paths: getPaths(),
		services: getServices(),
		isReadOnly: getExecutingEnvironment() === "next",

		version: env("GRAMAX_VERSION") ?? null,
		buildVersion: env("BUILD_VERSION") ?? null,

		glsUrl: env("GEPS_URL") ?? null,
		isProduction: env("PRODUCTION") === "true",
		isRelease: (env("BRANCH") ?? "develop") == "master",
		disableSeo: env("DISABLE_SEO") === "true",

		bugsnagApiKey: env("BUGSNAG_API_KEY") ?? null,
		yandexMetricCounter: env("YANDEX_METRIC_COUNTER") ?? null,

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

		enterprise: {
			gesUrl: env("GES_URL"),
		},

		logo: {
			imageUrl: env("LOGO_IMAGE_URL"),
			linkUrl: env("LOGO_LINK_URL") ?? "/",
			linkTitle: env("LOGO_LINK_TITLE"),
		},
	} as AppConfig;

	return global.config;
};
