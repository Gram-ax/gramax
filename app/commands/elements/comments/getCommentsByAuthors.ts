import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import type { AuthoredCommentsByAuthor } from "@ext/markdown/elements/comment/edit/logic/CommentsCounterStore";
import assert from "assert";
import { Command } from "../../../types/Command";

const getCommentsByAuthors: Command<{ ctx: Context; catalogName: string }, AuthoredCommentsByAuthor> = Command.create({
	path: "comments/getCommentsByAuthors",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	flags: ["otel-omit-result"],

	async do({ ctx, catalogName }) {
		const { parserContextFactory, parser } = this._app;
		const workspace = this._app.wm.current();
		if (!catalogName) return;

		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog, "Catalog not found");

		const commentProvider = catalog.customProviders.commentProvider;
		const result = commentProvider.getCommentsByAuthors(parser, parserContextFactory, ctx);

		return result;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getCommentsByAuthors;
