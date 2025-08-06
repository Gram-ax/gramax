import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import DefaultGramaxAi from "@ext/ai/logic/GramaxAi";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { Command } from "../../../types/Command";

const checkAuth: Command<{ ctx: Context; apiUrl: string; token: string }, boolean> = Command.create({
	path: "ai/server/checkAuth",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ apiUrl, token }) {
		try {
			const provider = new DefaultGramaxAi({ apiUrl, token });

			const res = await provider.checkAuth();

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
		const token = q.token;

		return { ctx, apiUrl, token };
	},
});

export default checkAuth;
