import type { AppConfig } from "@app/config/AppConfig";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";

export { createSearcherManager as createBrowserSearcherManager } from "./browser";
export { createSearcherManager as createNodeSearcherManager } from "./node";

export interface CreateSearcherManagerArgs {
	config: AppConfig;
	wm: WorkspaceManager;
	parser: MarkdownParser;
	searchResourcesEnabled: boolean;
	parserContextFactory: ParserContextFactory;
}
