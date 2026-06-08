import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { ChatCompletionToolDefinition } from "../llm/agentLlmChatCompletions";
import { getAgentToolsRegistry } from "./registry";

export type ToolExecutionResult = {
	ok: boolean;
	data?: unknown;
	error?: string;
};

export function ok(data: unknown): ToolExecutionResult {
	return { ok: true, data, error: undefined };
}

export function fail(error: string): ToolExecutionResult {
	return { ok: false, error, data: undefined };
}

export type ToolSession = {
	getTools(): Promise<ChatCompletionToolDefinition[]>;
	callTool(name: string, args: unknown, openItemPath?: string | null): Promise<ToolExecutionResult>;
};

export type ToolExecutionContext = {
	input: unknown;
	app: Application;
	ctx: Context;
	commands: CommandTree;
	openItemPath?: string | null;
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

export function findTool(name: string) {
	return getAgentToolsRegistry().find((t) => t.name === name);
}

export async function executeTool(
	name: string,
	input: unknown,
	app: Application,
	ctx: Context,
	commandTree: unknown,
	openItemPath?: string | null,
): Promise<ToolExecutionResult> {
	const tool = findTool(name);
	if (!tool) {
		return fail(`Unknown tool: ${name}`);
	}
	const context: ToolExecutionContext = {
		input,
		app,
		ctx,
		commands: commandTree as ToolExecutionContext["commands"],
		openItemPath,
	};
	return tool.execute(context);
}
