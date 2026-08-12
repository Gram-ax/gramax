import type { WebSearchAdapter } from "../adapter";

export function createWebSearchAdapter(provider: string, _endpoint: string): WebSearchAdapter {
	switch (provider) {
		default:
			throw new Error(`Unsupported web search provider: ${provider}`);
	}
}
