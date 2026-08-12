export type WebSearchResult = {
	title: string;
	url: string;
};

export interface WebSearchAdapter {
	search(input: {
		query: string;
		limit: number;
		signal?: AbortSignal;
		timeoutMs?: number;
	}): Promise<WebSearchResult[]>;
}
