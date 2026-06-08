import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { buildCatalogItemLookup } from "../utils/catalogPaths";

type DeleteCatalogItemInput = {
	catalogName: string;
	itemPath: string;
};

export async function runDeleteCatalogItem({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath } = input as DeleteCatalogItemInput;
	const lookup = buildCatalogItemLookup(catalogName, itemPath);
	try {
		const catalog = await app.wm.current().getCatalog(lookup.catalogName, ctx);
		const item = catalog.findItemByItemPath(lookup.fullPath);
		if (!item) return fail(`Item not found. itemPath: ${lookup.itemPath}`);
		if (item.ref === undefined || item.ref === null) {
			return fail(`Item has no ref. itemPath: ${lookup.itemPath}`);
		}
		const parser = new ArticleParser(ctx, app.parser, app.parserContextFactory);
		await catalog.deleteItem(item.ref, parser, false);
		return ok({ itemPath: lookup.itemPath, refreshPage: true });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Delete error (${lookup.itemPath}): ${msg}`);
	}
}
