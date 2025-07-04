import { EnvironmentVariable } from "@app/config/env";
import Path from "@core/FileProvider/Path/Path";
import type { WorkspaceManagerConfig } from "@ext/workspace/WorkspaceManager";
import { env, getExecutingEnvironment } from "../resolveModule/env";

export type AppGlobalConfig = WorkspaceManagerConfig & EnterpriseConfig;

interface AppConfigPaths {
	base: Path;
	root: Path;
	data: Path;
	default: Path;
}

export interface ServicesConfig {
	gitProxy: { url: string };
	auth: { url: string };
	cloud?: { url: string };
	review?: { url: string };
	diagramRenderer: { url: string };
}

export interface EnterpriseConfig {
	gesUrl: string;
}

export interface MetricsConfig {
	yandex: {
		metricCounter: string;
	};
	matomo: {
		matomoUrl: string;
		matomoSiteId: string;
		matomoContainerUrl: string;
	};
}

export type AppConfig = {
	version: string;
	buildVersion: string;

	isRelease: boolean;
	isReadOnly: boolean;
	isProduction: boolean;
	disableSeo: boolean;

	bugsnagApiKey: string;
	paths: AppConfigPaths;

	mail: { user: string; password: string };
	admin: { login: string; password: string };
	tokens: { share: string; cookie: string };
	services: ServicesConfig;
	enterprise: EnterpriseConfig;

	metrics: MetricsConfig;

	logo: { imageUrl: string; linkUrl: string; linkTitle: string };
	allowedGramaxUrls: string[];

	portalAi: {
		enabled: boolean;
		apiUrl: string;
		token: string;
		instanceName: string;
	};

	search: {
		elastic: {
			enabled: boolean;
			apiUrl: string;
			instanceName: string;
			username: string;
			password: string;
		};
	};
};

const getServices = (): ServicesConfig => {
	return {
		gitProxy: {
			url: env("GIT_PROXY_SERVICE_URL") || "https://develop.gram.ax/git-proxy",
		},
		auth: {
			url: env("AUTH_SERVICE_URL") || "https://gram.ax/auth",
		},
		diagramRenderer: {
			url: env("DIAGRAM_RENDERER_SERVICE_URL") || null,
		},
		review: {
			url: env("REVIEW_SERVICE_URL") || null,
		},
		cloud: {
			url: env("CLOUD_SERVICE_URL") || null,
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
	const userData = (env("USER_DATA_PATH") && new Path(env("USER_DATA_PATH"))) || root;

	return {
		base: new Path(env("BASE_PATH")),
		root,
		data: userData,
		default: new Path(env("GRAMAX_DEFAULT_WORKSPACE_PATH")),
	};
};

export const getConfig = (): AppConfig => {
	if (global.config) return global.config;

	const requiredEnvVars: (keyof EnvironmentVariable)[] = [];

	const aiApiUrl = env("AI_SERVER_URL");
	const aiInstanceName = env("AI_INSTANCE_NAME");
	const aiToken = env("AI_TOKEN");
	const aiEnabled = Boolean(aiApiUrl && aiInstanceName && aiToken);
	if (aiEnabled && (!aiApiUrl || !aiInstanceName || !aiToken)) {
		if (!aiApiUrl) requiredEnvVars.push("AI_SERVER_URL");
		if (!aiInstanceName) requiredEnvVars.push("AI_INSTANCE_NAME");
		if (!aiToken) requiredEnvVars.push("AI_TOKEN");
	}
	if (requiredEnvVars.length > 0) {
		throw new Error(`Environment variable(s) must have value: [${requiredEnvVars.join(", ")}]`);
	}

	const elasticApiUrl = env("ELASTIC_SEARCH_API_URL");
	const elasticInstanceName = env("ELASTIC_SEARCH_INSTANCE_NAME");
	const elasticEnabled = Boolean(elasticApiUrl && elasticInstanceName);

	global.config = {
		paths: getPaths(),
		services: getServices(),
		isReadOnly:
			getExecutingEnvironment() === "next" ||
			getExecutingEnvironment() === "static" ||
			getExecutingEnvironment() === "cli",

		portalAi: {
			enabled: aiEnabled,
			apiUrl: aiApiUrl,
			instanceName: aiInstanceName,
			token: aiToken,
		},

		search: {
			elastic: {
				enabled: elasticEnabled,
				apiUrl: elasticApiUrl,
				instanceName: elasticInstanceName,
				username: env("ELASTIC_SEARCH_USERNAME"),
				password: env("ELASTIC_SEARCH_PASSWORD"),
			},
		},

		version: env("GRAMAX_VERSION") || null,
		buildVersion: env("BUILD_VERSION") || null,

		isProduction: env("PRODUCTION") === "true",
		isRelease: (env("BRANCH") || "develop") == "master",
		disableSeo: env("DISABLE_SEO") === "true",

		bugsnagApiKey: env("BUGSNAG_API_KEY") || null,

		metrics: {
			yandex: { metricCounter: env("YANDEX_METRIC_COUNTER") || null },
			matomo: {
				matomoSiteId: env("MATOMO_SITE_ID") || null,
				matomoUrl: env("MATOMO_URL") || null,
				matomoContainerUrl: env("MATOMO_CONTAINER_URL") || null,
			},
		},

		admin: {
			login: env("ADMIN_LOGIN") || null,
			password: env("ADMIN_PASSWORD") || null,
		},

		tokens: {
			share: env("SHARE_ACCESS_TOKEN") || null,
			cookie: env("COOKIE_SECRET") || null,
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
			linkUrl: env("LOGO_LINK_URL") || "/",
			linkTitle: env("LOGO_LINK_TITLE"),
		},

		allowedGramaxUrls: env("ALLOWED_GRAMAX_URLS")
			?.split(",")
			.map((origin) => origin.trim()),
	} as AppConfig;

	return global.config;
};
