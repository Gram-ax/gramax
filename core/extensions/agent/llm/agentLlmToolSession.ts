import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import { getAgentSession } from "../core/sessionStore";
import { executeTool, type ToolExecutionResult, type ToolSession } from "../mcp/tool";
import type { ChatCompletionToolDefinition } from "./agentLlmChatCompletions";

export class AgentLlmToolSession implements ToolSession {
	constructor(
		private readonly _app: Application,
		private readonly _ctx: Context,
		private readonly _commands: CommandTree,
		private readonly _sessionId?: string,
	) {}

	async getTools(): Promise<ChatCompletionToolDefinition[]> {
		const { getAgentToolsRegistry } = await import("../mcp/registry");
		return getAgentToolsRegistry().map((t) => ({
			type: "function" as const,
			function: {
				name: t.name,
				description: t.description,
				parameters: {
					type: "object",
					properties: t.inputSchema.properties ?? {},
					...(t.inputSchema.required?.length ? { required: t.inputSchema.required } : {}),
					additionalProperties: true,
				},
			},
		}));
	}

	async callTool(name: string, args: unknown, openItemPath?: string | null): Promise<ToolExecutionResult> {
		const currentOpenItemPath = this._sessionId ? getAgentSession(this._sessionId)?.openItemPath : openItemPath;
		return executeTool(name, args, this._app, this._ctx, this._commands, currentOpenItemPath);
	}
}
