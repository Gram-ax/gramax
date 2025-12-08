type Bool = "true" | "false";

export type EnvironmentVariable = {
	PORT: string;
	BRANCH: string;
	BUILD_VERSION: string;
	GRAMAX_VERSION: string;
	COOKIE_SECRET: string;

	PRODUCTION: Bool;

	// Services
	AUTH_SERVICE_URL: string;
	CLOUD_SERVICE_URL: string;
	DIAGRAM_RENDERER_SERVICE_URL: string;
	REVIEW_SERVICE_URL: string;
	GIT_PROXY_SERVICE_URL: string;

	// AutoPull
	AUTO_PULL_TOKEN: string;
	AUTO_PULL_USERNAME: string;
	AUTO_PULL_INTERVAL: number;

	// FileProvider
	ROOT_PATH: string;
	BASE_PATH: string;
	USER_DATA_PATH: string;
	GRAMAX_DEFAULT_WORKSPACE_PATH: string;

	// Other
	FORCE_UI_LANG_SYNC: Bool;
	DEFAULT_UI_LANGUAGE: string;
	SHARE_ACCESS_TOKEN: string;
	DOC_READER_MAIL: string;
	DOC_READER_MAIL_PASSWORD: string;
	DOCPORTAL_FEATURES: string;
	FEATURES: string;

	// Algolia
	NEXT_PUBLIC_ALGOLIA_APP_ID: string;
	ALGOLIA_SEARCH_ADMIN_KEY: string;
	ALGOLIA_SEARCH_INDEX_NAME: string;

	// Typesense
	TUPESENSE_HOST: string;
	TUPESENSE_PORT: string;
	TUPESENSE_PROTOCOL: string;
	TUPESENSE_API_KEY: string;
	TUPESENSE_COLLECTION_NAME: string;

	// Bugsnag
	BUGSNAG_API_KEY: string;

	// Yandex
	YANDEX_METRIC_COUNTER: string;

	// kafka
	KAFKA_CONNECTION: string;

	// Admin
	ADMIN_LOGIN: string;
	ADMIN_PASSWORD: string;

	// Enterprise
	GES_URL: string;
	ALLOWED_GRAMAX_URLS: string;
	GES_REFRESH_INTERVAL: string;

	// Enterprise Cloud
	GES_IS_CLOUD: Bool;

	// SEO
	DISABLE_SEO: Bool;

	// MATOMO
	MATOMO_SITE_ID: string;
	MATOMO_URL: string;
	MATOMO_CONTAINER_URL: string;

	// Logo
	LOGO_IMAGE_URL: string;
	LOGO_LINK_URL: string;
	LOGO_LINK_TITLE: string;

	// ElasticSearch
	ELASTIC_SEARCH_API_URL: string;
	ELASTIC_SEARCH_INSTANCE_NAME: string;
	ELASTIC_SEARCH_USERNAME: string;
	ELASTIC_SEARCH_PASSWORD: string;

	// AI
	AI_SERVER_URL: string;
	AI_INSTANCE_NAME: string;
	AI_TOKEN: string;

	// DESKTOP ONLY
	IS_MOBILE: Bool;
	UPDATE_INSTALLED: string;
};

export const defaultVariables: Partial<EnvironmentVariable> = {
	GRAMAX_VERSION: "unknown-version",
};
