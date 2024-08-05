type Bool = "true" | "false";

export type EnvironmentVariable = {
	PORT: string;
	BRANCH: string;
	BUILD_VERSION: string;
	GRAMAX_VERSION: string;
	COOKIE_SECRET: string;

	READ_ONLY: Bool;
	SERVER_APP: Bool;
	PRODUCTION: Bool;

	// Services
	AUTH_SERVICE_URL: string;
	SSO_SERVICE_PUBLIC_KEY: string;
	SSO_SERVICE_URL: string;
	DIAGRAM_RENDERER_SERVICE_URL: string;
	REVIEW_SERVICE_URL: string;
	CORS_PROXY_SERVICE_URL: string;

	// AutoPull
	AUTO_PULL_TOKEN: string;
	AUTO_PULL_INTERVAL: number;

	// FileProvider
	ROOT_PATH: string;
	BASE_PATH: string;
	USER_DATA_PATH: string;
	GRAMAX_DEFAULT_WORKSPACE_PATH: string;

	// Other
	SHARE_ACCESS_TOKEN: string;
	DOC_READER_MAIL: string;
	DOC_READER_MAIL_PASSWORD: string;

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
	WORKSPACE_PATH: string;
	GLS_URL: string;
};

export const defaultVariables: Partial<EnvironmentVariable> = {
	GRAMAX_VERSION: "unknown-version",
};
