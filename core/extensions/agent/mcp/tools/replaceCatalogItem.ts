import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type ParseError from "@ext/markdown/core/Parser/Error/ParseError";
import { AgentArticleParser } from "../parser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { updateCatalogItem, updateCatalogItemInUi } from "../utils/catalogItem";
import { CatalogItemLookup } from "../utils/catalogPaths";

type ReplaceCatalogItemInput = {
	catalogName: string;
	itemPath: string;
	oldContent: string;
	newContent: string;
	replaceAll: boolean;
};

export async function runReplaceCatalogItem(context: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath, oldContent, newContent, replaceAll } = context.input as ReplaceCatalogItemInput;
	if (!oldContent) {
		return fail("oldContent must be non-empty.");
	}

	const { app, ctx, commands, openCatalogName, openItemPath } = context;
	const catalog = await app.wm.current().getCatalog(catalogName, ctx);
	const item = catalog.findItemByItemPath(new Path(Path.join(catalogName, itemPath))) as Article | Category;
	if (!item) {
		return fail("Item not found");
	}
	if (item.type !== ItemType.article && item.type !== ItemType.category) {
		return fail(`Only article and category are supported, current type=${item.type}`);
	}

	const parser = await AgentArticleParser.open(app, ctx, commands, catalog, item);
	const source = await parser.getMarkdownForAgent();
	const parts = source.split(oldContent);
	const occurrences = parts.length - 1;

	if (occurrences === 0) {
		return fail("oldContent not found in document.");
	}
	if (!replaceAll && occurrences > 1) {
		return fail(
			`oldContent has multiple occurrences (${occurrences}). Set replaceAll=true or provide a more specific oldContent.`,
		);
	}

	const content = parts.join(newContent);
	try {
		const parsedContent = await updateCatalogItem(app, ctx, catalog, item, parser, content);
		const lookup = await CatalogItemLookup.fromCatalogItem(catalog, item);
		if (openCatalogName === lookup.catalogName && openItemPath === lookup.itemPath) {
			await updateCatalogItemInUi(item, parsedContent, ctx, commands, catalog);
		}
	} catch (e) {
		const cause = (e as ParseError).cause;
		if (cause) {
			const msg = `Parse failed: ${cause.message}`;
			return fail(msg);
		}
		const msg = e instanceof Error ? e.message : String(e);
		return fail(msg);
	}

	return ok({
		...(await CatalogItemLookup.fromCatalogItem(catalog, item)).asJSON(),
		replacedCount: replaceAll ? occurrences : 1,
		replaceAll,
	});
}
