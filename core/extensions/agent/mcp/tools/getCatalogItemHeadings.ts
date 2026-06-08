import type { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { buildCatalogItemLookup } from "../utils/catalogPaths";
import { createParserForRead } from "../utils/markdownParser";

type GetCatalogItemHeadingsInput = {
	catalogName: string;
	itemPath: string;
};

export async function runGetCatalogItemHeadings({
	app,
	ctx,
	input,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath } = input as GetCatalogItemHeadingsInput;
	const lookup = buildCatalogItemLookup(catalogName, itemPath);
	try {
		const catalog = await app.wm.current().getCatalog(lookup.catalogName, ctx);
		const item = catalog.findItemByItemPath<Article | Category>(lookup.fullPath);
		if (!item) return fail(`Node not found. itemPath: ${lookup.itemPath}`);
		const props = (item.props ?? {}) as Record<string, unknown>;
		const propsTitle = typeof props.title === "string" ? props.title : undefined;
		const parser = createParserForRead(item, propsTitle);
		return ok({ itemPath: lookup.itemPath, headings: parser.getHeadingHierarchy() });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Headings read error (${lookup.itemPath}): ${msg}`);
	}
}
