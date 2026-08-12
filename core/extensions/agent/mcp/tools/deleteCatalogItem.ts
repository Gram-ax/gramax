import Path from "@core/FileProvider/Path/Path";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { CatalogItemLookup } from "../utils/catalogPaths";

type DeleteCatalogItemInput = {
	catalogName: string;
	itemPath: string;
};

export async function runDeleteCatalogItem({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath } = input as DeleteCatalogItemInput;
	try {
		const catalog = await app.wm.current().getCatalog(catalogName, ctx);
		const item = catalog.findItemByItemPath(new Path(Path.join(catalogName, itemPath)));
		if (!item) return fail(`Item not found`);
		const itemInfo = (await CatalogItemLookup.fromCatalogItem(catalog, item)).asJSON();
		const parser = new ArticleParser(ctx, app.parser, app.parserContextFactory);
		await catalog.deleteItem(item.ref, parser, false);
		return ok(itemInfo, true);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to delete item: ${msg}`);
	}
}
