import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";

export type ArticleAdapterContext = {
	app: Application;
	ctx: Context;
	commands: CommandTree;
	catalog: ContextualCatalog;
	item: Article | Category;
};

export interface ArticleAdapter {
	expandToAgentView(storageMarkdown: string, context: ArticleAdapterContext): Promise<string>;
	applyAgentViewToStorage(agentMarkdown: string, context: ArticleAdapterContext): Promise<string>;
}
