import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { agentConfig } from "../../core/agentConfig";
import { MCP_PROMPT_MAP } from "../../prompts/mcpPromptMap";
import { AgentArticleParser } from "../parser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { CatalogItemLookup } from "../utils/catalogPaths";

type ReadCatalogItemInput = {
	catalogName: string;
	itemPath: string;
	headingId?: string;
};

export async function runReadCatalogItem({
	app,
	ctx,
	commands,
	input,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath, headingId } = input as ReadCatalogItemInput;
	try {
		const catalog = await app.wm.current().getCatalog(catalogName, ctx);
		const item = catalog.findItemByItemPath(new Path(Path.join(catalogName, itemPath)));
		if (!item) return fail(`Item not found`);
		if (item.type !== ItemType.article && item.type !== ItemType.category) {
			return fail(`Only article and category are supported, current type=${item.type}`);
		}
		const parser = await AgentArticleParser.open(app, ctx, commands, catalog, item as Article | Category);
		const content = headingId ? await parser.getMarkdownForHeading(headingId) : await parser.getMarkdownForAgent();
		if (content.length > agentConfig.readMaxChars) {
			return ok({
				message: MCP_PROMPT_MAP.readCatalogItem.tooLarge,
				headings: await parser.getHeadingHierarchy(),
			});
		}

		return ok({
			...(await CatalogItemLookup.fromCatalogItem(catalog, item)).asJSON(),
			content,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to read item: ${msg}`);
	}
}
