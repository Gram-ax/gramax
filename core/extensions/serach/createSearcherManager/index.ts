import type { AppConfig } from "@app/config/AppConfig";
import type { HealthcheckRegistry } from "@ext/healthcheck/HealthCheckRegistry";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type { TableDB } from "@ext/tableDB/table";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";

export { createSearcherManager as createNodeSearcherManager } from "./node";
export { createSearcherManager as createWebSearcherManager } from "./web";

export interface CreateSearcherManagerArgs {
	config: AppConfig;
	wm: WorkspaceManager;
	parser: MarkdownParser;
	parserContextFactory: ParserContextFactory;
	tablesManager: TableDB;
	healthcheckRegistry?: HealthcheckRegistry;
}
