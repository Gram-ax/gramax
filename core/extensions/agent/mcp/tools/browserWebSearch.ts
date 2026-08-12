import { agentBrowserConfig } from "../../browser/config";
import { createWebSearchAdapter } from "../../browser/providers";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type SearchWebInput = {
	query: string;
	limit?: number;
};

type SearchWebOutput = {
	query: string;
	results: Array<{
		id: string;
		title: string;
		url: string;
	}>;
};

function timeoutSignal(ms: number): AbortSignal | undefined {
	if (typeof AbortSignal === "undefined" || typeof AbortSignal.timeout !== "function") return undefined;
	return AbortSignal.timeout(ms);
}

export async function runSearchWeb({ input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { query, limit } = input as SearchWebInput;
	const queryText = query?.trim();

	if (!queryText) {
		return fail("query is required");
	}

	const { provider, endpoint, maxResults, timeoutMs } = agentBrowserConfig;
	const normalizedLimit =
		typeof limit === "number" && Number.isFinite(limit)
			? Math.max(1, Math.min(Math.trunc(limit), maxResults))
			: maxResults;

	try {
		const result = await createWebSearchAdapter(provider, endpoint).search({
			query: queryText,
			limit: normalizedLimit,
			signal: timeoutSignal(timeoutMs),
			timeoutMs,
		});

		const output: SearchWebOutput = {
			query: queryText,
			results: result.map((item, index) => ({
				id: `turn1search${index}`,
				title: item.title,
				url: item.url,
			})),
		};

		return ok(output);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to search web: ${msg}`);
	}
}
