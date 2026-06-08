import { getToolsDescriptions } from "../prompts";
// import { runGitCommit } from "./tools/gitCommit";
import type { ToolDefinition } from "./tool";
import { runCreateCatalogItem } from "./tools/createCatalogItem";
import { runDeleteCatalogItem } from "./tools/deleteCatalogItem";
import { runGetCatalogItemHeadings } from "./tools/getCatalogItemHeadings";
import { runGetNavigation } from "./tools/getNavigation";
import { runGitDiscard } from "./tools/gitDiscard";
import { runGitInspect } from "./tools/gitInspect";
import { runListCatalogs } from "./tools/listCatalogs";
import { runMoveCatalogItem } from "./tools/moveCatalogItem";
import { runReadAgentSkill } from "./tools/readAgentSkill";
import { runReadCatalogItem } from "./tools/readCatalogItem";
import { runSearchCatalogs } from "./tools/searchCatalogs";
import { runUpdateCatalogItem } from "./tools/updateCatalogItem";

export function getAgentToolsRegistry(): ToolDefinition[] {
	const docs = getToolsDescriptions();
	return [
		{
			name: "read_agent_skill",
			description: docs.readAgentSkill.description,
			inputSchema: {
				type: "object",
				properties: {
					skillName: { type: "string", description: docs.readAgentSkill.input.skillName },
				},
				required: ["skillName"],
				additionalProperties: false,
			},
			async execute(context) {
				return runReadAgentSkill(context);
			},
		},
		{
			name: "list_catalogs",
			description: docs.listCatalogs.description,
			inputSchema: { type: "object", properties: {}, additionalProperties: false },
			async execute(context) {
				return runListCatalogs(context);
			},
		},
		{
			name: "read_catalog_item",
			description: docs.readCatalogItem.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.readCatalogItem.input.catalogName },
					itemPath: { type: "string", description: docs.readCatalogItem.input.itemPath },
					lineStart: {
						type: "integer",
						description: docs.readCatalogItem.input.lineStart,
						exclusiveMinimum: 0,
					},
					lineEnd: { type: "integer", description: docs.readCatalogItem.input.lineEnd, minimum: 0 },
				},
				required: ["catalogName", "itemPath"],
				additionalProperties: false,
			},
			async execute(context) {
				return runReadCatalogItem(context);
			},
		},
		{
			name: "get_catalog_item_headings",
			description: docs.getCatalogItemHeadings.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.getCatalogItemHeadings.input.catalogName },
					itemPath: { type: "string", description: docs.getCatalogItemHeadings.input.itemPath },
				},
				required: ["catalogName", "itemPath"],
				additionalProperties: false,
			},
			async execute(context) {
				return runGetCatalogItemHeadings(context);
			},
		},
		{
			name: "search_catalogs",
			description: docs.searchCatalogs.description,
			inputSchema: {
				type: "object",
				properties: {
					query: { type: "string", description: docs.searchCatalogs.input.query },
					catalogName: { type: "string", description: docs.searchCatalogs.input.catalogName },
					itemPath: { type: "string", description: docs.searchCatalogs.input.itemPath },
				},
				required: ["query"],
				additionalProperties: false,
			},
			async execute(context) {
				return runSearchCatalogs(context);
			},
		},
		{
			name: "get_navigation",
			description: docs.getNavigation.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.getNavigation.input.catalogName },
					itemPath: { type: "string", description: docs.getNavigation.input.itemPath },
				},
				required: ["catalogName"],
				additionalProperties: false,
			},
			async execute(context) {
				return runGetNavigation(context);
			},
		},
		{
			name: "delete_catalog_item",
			description: docs.deleteCatalogItem.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.deleteCatalogItem.input.catalogName },
					itemPath: { type: "string", description: docs.deleteCatalogItem.input.itemPath },
				},
				required: ["catalogName", "itemPath"],
				additionalProperties: false,
			},
			async execute(context) {
				return runDeleteCatalogItem(context);
			},
		},
		{
			name: "move_catalog_item",
			description: docs.moveCatalogItem.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.moveCatalogItem.input.catalogName },
					fromItemPath: { type: "string", description: docs.moveCatalogItem.input.fromItemPath },
					toItemPath: { type: "string", description: docs.moveCatalogItem.input.toItemPath },
				},
				required: ["catalogName", "fromItemPath", "toItemPath"],
				additionalProperties: false,
			},
			async execute(context) {
				return runMoveCatalogItem(context);
			},
		},
		{
			name: "git_inspect",
			description: docs.gitInspect.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.gitInspect.input.catalogName },
					action: {
						type: "string",
						enum: ["status", "file_diff"],
						description: docs.gitInspect.input.action,
					},
					filePath: { type: "string", description: docs.gitInspect.input.filePath },
				},
				required: ["catalogName", "action"],
				additionalProperties: false,
			},
			async execute(context) {
				return runGitInspect(context);
			},
		},
		{
			name: "git_discard",
			description: docs.gitDiscard.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.gitDiscard.input.catalogName },
					filePaths: {
						type: "array",
						items: { type: "string" },
						description: docs.gitDiscard.input.filePaths,
					},
				},
				required: ["catalogName"],
				additionalProperties: false,
			},
			async execute(context) {
				return runGitDiscard(context);
			},
		},
		// {
		// 	name: "git_commit",
		// 	description: docs.gitCommit.description,
		// 	inputSchema: {
		// 		type: "object",
		// 		properties: {
		// 			catalogName: { type: "string", description: docs.gitCommit.input.catalogName },
		// 			message: { type: "string", description: docs.gitCommit.input.message },
		// 			filePaths: {
		// 				type: "array",
		// 				items: { type: "string" },
		// 				description: docs.gitCommit.input.filePaths,
		// 			},
		// 		},
		// 		required: ["catalogName", "message"],
		// 		additionalProperties: false,
		// 	},
		// 	async execute(context) {
		// 		return runGitCommit(context);
		// 	},
		// },
		{
			name: "create_catalog_item",
			description: docs.createCatalogItem.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.createCatalogItem.input.catalogName },
					type: {
						type: "string",
						enum: ["article", "category"],
						description: docs.createCatalogItem.input.type,
					},
					name: { type: "string", description: docs.createCatalogItem.input.name },
					parentItemPath: { type: "string", description: docs.createCatalogItem.input.parentItemPath },
					content: { type: "string", description: docs.createCatalogItem.input.content },
				},
				required: ["catalogName", "type", "name"],
				additionalProperties: false,
			},
			async execute(context) {
				return runCreateCatalogItem(context);
			},
		},
		{
			name: "update_catalog_item",
			description: docs.updateCatalogItem.description,
			inputSchema: {
				type: "object",
				properties: {
					catalogName: { type: "string", description: docs.updateCatalogItem.input.catalogName },
					itemPath: { type: "string", description: docs.updateCatalogItem.input.itemPath },
					content: { type: "string", description: docs.updateCatalogItem.input.content },
					lineStart: {
						type: "integer",
						description: docs.updateCatalogItem.input.lineStart,
						exclusiveMinimum: 0,
					},
					lineEnd: { type: "integer", description: docs.updateCatalogItem.input.lineEnd, minimum: 0 },
				},
				required: ["catalogName", "itemPath", "content"],
				additionalProperties: false,
			},
			async execute(context) {
				return runUpdateCatalogItem(context);
			},
		},
	];
}
