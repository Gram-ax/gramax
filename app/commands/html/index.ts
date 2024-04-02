import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const html: Command<{ ctx: Context; path: string[]; domain: string }, string> = Command.create({
	path: "html",

	kind: ResponseKind.html,

	do({ ctx, path, domain }) {
		const provider = this._app.sitePresenterFactory.fromContext(ctx);
		return provider.getHtml(path, domain);
	},

	params(ctx, q) {
		return { ctx, path: q.path as any as string[], domain: q.domain };
	},
});

export default html;
