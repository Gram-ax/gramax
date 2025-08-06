import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { Command } from "../../../types/Command";
import Context from "@core/Context/Context";
import DefaultGramaxAi from "@ext/ai/logic/GramaxAi";
import assert from "assert";

const getPrettifiedText: Command<{ ctx: Context; catalogName: string; command: string; text: string }, string> =
	Command.create({
		path: "ai/text/prettify",

		kind: ResponseKind.plain,

		middlewares: [new AuthorizeMiddleware()],

		async do({ ctx, text, command, catalogName }) {
			const { wm } = this._app;
			const workspace = wm.current();
			const catalog = await workspace.getCatalog(catalogName, ctx);

			if (!catalog) return;
			const promptProvider = catalog.customProviders.promptProvider;
			const newCommand = promptProvider.getArticle(command)?.content || command;

			const data = await this._commands.ai.server.getAiData.do({ ctx, workspacePath: workspace.path() });

			assert(data.token, "AI Server token is required");
			assert(data.apiUrl, "AI Server API URL is required");

			const aiProvider = new DefaultGramaxAi({ apiUrl: data.apiUrl, token: data.token });

			const res = await aiProvider.prettifyText(newCommand, text);
			return res;
		},

		params(ctx, q, body) {
			const command = q.command;
			const text = body;
			const catalogName = q.catalogName;
			return { ctx, text, command, catalogName };
		},
	});

export default getPrettifiedText;
