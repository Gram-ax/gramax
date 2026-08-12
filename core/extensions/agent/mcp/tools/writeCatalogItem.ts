import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type ParseError from "@ext/markdown/core/Parser/Error/ParseError";
import { AgentArticleParser } from "../parser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { updateCatalogItem, updateCatalogItemInUi } from "../utils/catalogItem";
import { CatalogItemLookup } from "../utils/catalogPaths";

type WriteCatalogItemInput = {
	catalogName: string;
	itemPath: string;
	content: string;
	headingId?: string;
};

export async function runWriteCatalogItem({
	app,
	ctx,
	commands,
	input,
	openCatalogName,
	openItemPath,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath, content, headingId } = input as WriteCatalogItemInput;
	try {
		const catalog = await app.wm.current().getCatalog(catalogName, ctx);
		const item = catalog.findItemByItemPath(new Path(Path.join(catalogName, itemPath))) as Article | Category;
		if (!item) return fail(`Item not found`);
		if (item.type !== ItemType.article && item.type !== ItemType.category) {
			return fail(`Only article and category are supported, current type=${item.type}`);
		}
		const parser = await AgentArticleParser.open(app, ctx, commands, catalog, item);
		const parsedContent = await updateCatalogItem(app, ctx, catalog, item, parser, content, headingId);
		const lookup = await CatalogItemLookup.fromCatalogItem(catalog, item);
		if (openCatalogName === lookup.catalogName && openItemPath === lookup.itemPath) {
			await updateCatalogItemInUi(item, parsedContent, ctx, commands, catalog);
		}
		return ok({
			...lookup.asJSON(),
			...(headingId ? { headingId } : {}),
		});
	} catch (e) {
		const cause = (e as ParseError).cause;
		if (cause) {
			const msg = `Parse failed: ${cause.message}`;
			return fail(msg);
		}
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to write item: ${msg}`);
	}
}
