import type { CommandTree } from "@app/commands";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { buildPath } from "../utils/catalogPaths";
import { compactSearchResults } from "../utils/searchResults";

const DEFAULT_SEARCH_TIMEOUT_MS = 120_000;
const DEFAULT_INDEX_PROGRESS_WAIT_MS = 300_000;
const DEFAULT_SEARCH_HITS_LIMIT = 15;
const DEFAULT_SNIPPETS_PER_HIT = 2;
const DEFAULT_SNIPPET_MAX_CHARS = 240;

type SearchCatalogsInput = {
	query: string;
	catalogName?: string;
	itemPath?: string;
};

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

export async function runSearchCatalogs({ ctx, input, commands }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { query, catalogName, itemPath: scopeItemPath } = input as SearchCatalogsInput;
	const cat = catalogName?.trim();
	const scopeRaw = scopeItemPath?.trim();
	if (scopeRaw && !cat) {
		return fail("itemPath (search scope) is set without catalogName — provide catalogName.");
	}
	const queryText = query.trim();
	const gramaxSearchRootRef = cat && scopeRaw ? buildPath(cat, scopeRaw) : undefined;
	const progressWaitSignal = timeoutSignal(DEFAULT_INDEX_PROGRESS_WAIT_MS);

	try {
		await commands.search.resetSearchData.do({
			type: undefined,
			force: false,
			catalogName: cat || undefined,
		});
		await waitUntilIndexingProgressDone(commands.search, progressWaitSignal);
		const searchSignal = timeoutSignal(DEFAULT_SEARCH_TIMEOUT_MS);
		const results = await commands.search.searchCommand.do({
			ctx,
			signal: searchSignal,
			query: queryText,
			catalogName: cat || undefined,
			articleRefFilter: gramaxSearchRootRef,
			propertyFilter: undefined,
			resourceFilter: undefined,
			articlesLanguage: undefined,
		});
		const compact = compactSearchResults(
			results,
			cat,
			DEFAULT_SEARCH_HITS_LIMIT,
			DEFAULT_SNIPPETS_PER_HIT,
			DEFAULT_SNIPPET_MAX_CHARS,
		);
		return ok(compact);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Search error: ${msg}`);
	}
}
