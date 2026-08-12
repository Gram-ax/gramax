import type { CommandTree } from "@app/commands";
import { agentConfig } from "../../core/agentConfig";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
// import { buildPath } from "../utils/catalogPaths";
import { compactSearchResults } from "../utils/searchResults";

type SearchCatalogsInput = {
	query: string;
	catalogName?: string;
	// scopePath?: string;
};

// function normalizeScopePath(input: string): string {
// 	const normalized = input.trim().replace(/^[/\\]+/, "").replace(/\\/g, "/").replace(/\/+$/, "");
// 	if (!normalized || normalized.endsWith(".md")) return normalized;
// 	return `${normalized}/_index.md`;
// }

function timeoutSignal(ms: number): AbortSignal | undefined {
	if (typeof AbortSignal === "undefined" || typeof AbortSignal.timeout !== "function") return undefined;
	return AbortSignal.timeout(ms);
}

function parseNdjsonDoneLine(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed) return false;
	try {
		const item = JSON.parse(trimmed) as { type?: string };
		return item.type === "done";
	} catch {
		return false;
	}
}

function followParentAbort(parent: AbortSignal | undefined, child: AbortController): () => void {
	if (!parent) return () => {};
	const onAbort = () => child.abort();
	if (parent.aborted) {
		child.abort();
	} else {
		parent.addEventListener("abort", onAbort, { once: true });
	}
	return () => parent.removeEventListener("abort", onAbort);
}

async function waitUntilIndexingProgressDone(
	search: CommandTree["search"],
	parentSignal: AbortSignal | undefined,
): Promise<void> {
	const ac = new AbortController();
	const unfollow = followParentAbort(parentSignal, ac);
	try {
		if (ac.signal.aborted) {
			throw new DOMException("The operation was aborted.", "AbortError");
		}
		const { iterator } = await search.getIndexingProgress.do({
			type: undefined,
			resourceFilter: undefined,
			signal: ac.signal,
		});
		let buffer = "";
		try {
			for await (const chunk of iterator) {
				buffer += chunk;
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";
				for (const line of lines) {
					if (parseNdjsonDoneLine(line)) {
						ac.abort();
						return;
					}
				}
			}
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			throw e;
		}
	} finally {
		unfollow();
	}
}

export async function runSearchCatalogs({
	app,
	ctx,
	input,
	commands,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { query, catalogName } = input as SearchCatalogsInput;
	const cat = catalogName?.trim();
	// const scopeRaw = scopePath?.trim();
	// if (scopeRaw && !cat) {
	// 	return fail("scopePath is set without catalogName — provide catalogName.");
	// }
	const queryText = query.trim();
	// const normalizedScopePath = scopeRaw ? normalizeScopePath(scopeRaw) : undefined;
	// const gramaxSearchRootRef = cat && normalizedScopePath ? buildPath(cat, normalizedScopePath) : undefined;
	const { searchHitsLimit, searchSnippetsPerHit, searchTimeoutMs, searchIndexProgressWaitMs } = agentConfig;
	const progressWaitSignal = timeoutSignal(searchIndexProgressWaitMs);

	try {
		await commands.search.resetSearchData.do({
			type: undefined,
			force: false,
			catalogName: cat || undefined,
		});
		await waitUntilIndexingProgressDone(commands.search, progressWaitSignal);
		const searchSignal = timeoutSignal(searchTimeoutMs);
		const results = await commands.search.searchCommand.do({
			ctx,
			signal: searchSignal,
			query: queryText,
			catalogName: cat || undefined,
			articleRefFilter: undefined,
			propertyFilter: undefined,
			resourceFilter: undefined,
			articlesLanguage: undefined,
		});
		const hits = await compactSearchResults(app, ctx, results, searchHitsLimit, searchSnippetsPerHit);
		return ok({ hits });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to search catalogs: ${msg}`);
	}
}
