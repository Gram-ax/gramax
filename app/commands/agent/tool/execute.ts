import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import { Command } from "../../../types/Command";

const executeToolCommand: Command<{ ctx: Context; toolName: string; input: unknown }, unknown> = Command.create({
	path: "agent/tool/execute",

	kind: ResponseKind.json,

	async do({ ctx, toolName, input }) {
		const { executeTool } = await import("@ext/agent/mcp/tool");
		return executeTool(toolName, input, this._app, ctx, this._commands);
	},

	params(ctx, _q, body) {
		const toolName = typeof body?.toolName === "string" ? body.toolName : "";
		const input = body?.input;
		return { ctx, toolName, input };
	},
});

export default executeToolCommand;
