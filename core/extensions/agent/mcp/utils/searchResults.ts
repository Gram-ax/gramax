import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import "@core/utils/asyncUtils";
import type { SearchArticleResult, SearchResultItem } from "@ext/serach/Searcher";
import { agentConfig } from "../../core/agentConfig";
import { CatalogItemLookup } from "./catalogPaths";

function collectSnippets(items: SearchResultItem[], acc: string[]): void {
	for (const item of items) {
		if ("searchText" in item && item.searchText) {
			acc.push(item.searchText);
		}
		if ("items" in item && item.items.length) {
			collectSnippets(item.items as SearchResultItem[], acc);
		}
	}
}

export function collectSnippetsFromContent(content: string, query: string): string[] {
	if (!query) return [];

	const { searchSnippetSize, searchSnippetsPerHit } = agentConfig;
	const snippets: string[] = [];
	const lowerContent = content.toLowerCase();
	const lowerQuery = query.toLowerCase();
	let index = lowerContent.indexOf(lowerQuery);

	while (index !== -1 && snippets.length < searchSnippetsPerHit) {
		const start = Math.max(0, index - searchSnippetSize);
		const end = Math.min(content.length, index + query.length + searchSnippetSize);
		snippets.push(content.slice(start, end).replace(/\s+/g, " ").trim());
		index = lowerContent.indexOf(lowerQuery, index + query.length);
	}

	return snippets;
}

async function compactSearchHit(
	catalogName: string,
	catalog: ContextualCatalog,
	hit: SearchArticleResult,
	snippetsPerHit: number,
) {
	const slash = hit.refPath.indexOf("/");
	const itemPath = slash === -1 ? "" : hit.refPath.slice(slash + 1);
	if (!itemPath) return null;

	const snippetsRaw: string[] = [];
	collectSnippets(hit.items, snippetsRaw);
	const snippets = snippetsRaw.slice(0, snippetsPerHit).filter(Boolean);

	const item = catalog.findItemByItemPath(new Path(hit.refPath));
	const lookup = item
		? await CatalogItemLookup.fromCatalogItem(catalog, item)
		: new CatalogItemLookup(catalogName, itemPath);

	return { ...lookup.asJSON(), snippets };
}

export async function compactSearchResults(
	app: Application,
	ctx: Context,
	raw: unknown,
	hitsLimit: number,
	snippetsPerHit: number,
) {
	if (!Array.isArray(raw)) return [];

	const articles = raw.filter((x): x is SearchArticleResult => !!x && typeof x === "object" && "refPath" in x);
	const resolved: Awaited<ReturnType<typeof compactSearchHit>>[] = new Array(articles.length);
	const catalogs = new Map<string, ContextualCatalog>();

	await articles.forEachAsync(async (hit, index) => {
		const catalogName = hit.catalog.name;
		let catalog = catalogs.get(catalogName);
		if (!catalog) {
			catalog = await app.wm.current().getCatalog(catalogName, ctx);
			catalogs.set(catalogName, catalog);
		}

		resolved[index] = await compactSearchHit(catalogName, catalog, hit, snippetsPerHit);
	});

	return resolved.filter((hit): hit is NonNullable<typeof hit> => hit !== null).slice(0, hitsLimit);
}
