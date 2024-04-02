import { env } from "@app/resolveModule/env";

export default class AlgoliaConfig {
	private appId: string;
	private adminKey: string;
	private indexName: string;

	constructor() {
		this.appId = env("NEXT_PUBLIC_ALGOLIA_APP_ID");
		this.adminKey = env("ALGOLIA_SEARCH_ADMIN_KEY");
		this.indexName = env("ALGOLIA_SEARCH_INDEX_NAME");
	}

	getConfig(): { appId: string; adminKey: string; indexName: string } {
		return {
			appId: this.appId,
			adminKey: this.adminKey,
			indexName: this.indexName,
		};
	}
}
