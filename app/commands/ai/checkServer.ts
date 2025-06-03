import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";
import DefaultGramaxAi from "@ext/ai/logic/GramaxAi";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";

const serverAvailable: Command<{ ctx: Context; apiUrl: string }, boolean> = Command.create({
	path: "ai/checkServer",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ apiUrl }) {
		try {
			const provider = new DefaultGramaxAi({ apiUrl, token: "" });

			const res = await provider.checkServer();

			if (res.ok === false && res.error) {
				throw new DefaultError(res.error as string);
			}

			return res.ok;
		} catch (error) {
			return false;
		}
	},

	params(ctx, q) {
		const apiUrl = q.apiUrl;

		return { ctx, apiUrl };
	},
});

export default serverAvailable;
