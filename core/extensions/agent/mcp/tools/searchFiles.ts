import { agentConfig } from "../../core/agentConfig";
import { FileConverter } from "../parser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { collectSnippetsFromContent } from "../utils/searchResults";

type SearchFilesInput = {
	query: string;
	catalogName: string;
};

export async function runSearchFiles({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { query, catalogName } = input as SearchFilesInput;
	const queryText = query.trim();
	if (!queryText) return fail("query is required");
	const targetCatalogName = typeof catalogName === "string" ? catalogName.trim() : "";
	if (!targetCatalogName) return fail("catalogName is required");

	const wm = app.wm.current();
	const wmFp = wm.getFileProvider();
	const { searchHitsLimit } = agentConfig;
	const hits: { catalogName: string; filePath: string; snippets: string[] }[] = [];

	try {
		const catalog = await wm.getCatalog(targetCatalogName, ctx);
		const dirs = [catalog.basePath];

		while (dirs.length > 0 && hits.length < searchHitsLimit) {
			const dir = dirs.pop();
			if (!dir) break;

			for (const item of await wmFp.getItems(dir)) {
				const relativePath = catalog.getRepositoryRelativePath(item.path).value;
				const isExcluded = agentConfig.repoExcludedPathPatterns.some((pattern) => pattern.test(relativePath));
				if (isExcluded) {
					continue;
				}

				if (item.type === "dir") {
					dirs.push(item.path);
					continue;
				}
				if (item.type !== "file") continue;
				if (FileConverter.isBinaryAttachment(item.path.nameWithExtension)) continue;

				const snippets = collectSnippetsFromContent(await wmFp.read(item.path), queryText);
				if (snippets.length > 0) {
					hits.push({ catalogName: targetCatalogName, filePath: relativePath, snippets });
					if (hits.length >= searchHitsLimit) break;
				}
			}
		}

		return ok({ hits });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to search repository: ${msg}`);
	}
}
