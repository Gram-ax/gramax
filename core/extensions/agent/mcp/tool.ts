import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";

export type ToolExecutionResult = {
	ok: boolean;
	data?: unknown;
	error?: string;
	refreshPage?: boolean;
};

export function ok(data: unknown, refreshPage = false): ToolExecutionResult {
	return { ok: true, data, error: undefined, refreshPage };
}

export function fail(error: string, data?: unknown): ToolExecutionResult {
	return { ok: false, error, data };
}

export type ToolExecutionContext = {
	input: unknown;
	app: Application;
	ctx: Context;
	commands: CommandTree;
	sessionId?: string;
	openCatalogName?: string;
	openItemPath?: string;
};

export type ToolDefinition = {
	name: string;
	description: string;
	inputSchema: {
		type: "object";
		properties?: Record<string, unknown>;
		required?: string[];
		additionalProperties?: boolean;
	};
	execute: (context: ToolExecutionContext) => Promise<ToolExecutionResult>;
};
