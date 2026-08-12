import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { AgentArticleParser } from "../parser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { CatalogItemLookup } from "../utils/catalogPaths";

type GetCatalogItemHeadingsInput = {
	catalogName: string;
	itemPath: string;
};

export async function runGetCatalogItemHeadings({
	app,
	ctx,
	commands,
	input,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath } = input as GetCatalogItemHeadingsInput;
	try {
		const catalog = await app.wm.current().getCatalog(catalogName, ctx);
		const item = catalog.findItemByItemPath(new Path(Path.join(catalogName, itemPath))) as Article | Category;
		if (!item) return fail(`Item not found`);
		if (item.type !== ItemType.article && item.type !== ItemType.category) {
			return fail(`Only article and category are supported, current type=${item.type}`);
		}
		const parser = await AgentArticleParser.open(app, ctx, commands, catalog, item);
		return ok({
			...(await CatalogItemLookup.fromCatalogItem(catalog, item)).asJSON(),
			headings: await parser.getHeadingHierarchy(),
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to read headings from item: ${msg}`);
	}
}
