import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../../types/Command";
import DefaultGramaxAi from "@ext/ai/logic/GramaxAi";
import assert from "assert";

const getGeneratedText: Command<{ ctx: Context; catalogName: string; command: string }, string> = Command.create({
	path: "ai/text/generate",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, command, catalogName }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);

		if (!catalog) return;
		const promptProvider = catalog.customProviders.promptProvider;
		const newCommand = promptProvider.getArticle(command)?.content || command;
		const data = await this._commands.ai.server.getAiData.do({ ctx, workspacePath: workspace.path() });

		assert(data.token, "AI Server token is required");
		assert(data.apiUrl, "AI Server API URL is required");

		const aiProvider = new DefaultGramaxAi({
			apiUrl: data.apiUrl,
			token: data.token,
			meta: { instanceName: data.instanceName },
		});

		const res = await aiProvider.generateText(newCommand);
		return res;
	},

	params(ctx, q) {
		const command = q.command;
		const catalogName = q.catalogName;
		return { ctx, command, catalogName };
	},
});

export default getGeneratedText;
