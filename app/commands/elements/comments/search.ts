import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import type { ReviewListItem } from "@ext/review/models/ReviewList";
import type { ReviewSearchParams } from "@ext/review/models/ReviewSearchParams";
import assert from "assert";
import { Command } from "../../../types/Command";

const search: Command<{ ctx: Context; catalogName: string; params: ReviewSearchParams }, ReviewListItem[]> =
	Command.create({
		path: "comments/search",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

		flags: ["otel-omit-result"],

		async do({ ctx, catalogName, params }) {
			const { parser, parserContextFactory } = this._app;
			const workspace = this._app.wm.current();
			if (!catalogName) return [];

			const catalog = await workspace.getCatalog(catalogName, ctx);
			assert(catalog, "Catalog not found");

			return catalog.customProviders.commentProvider.searchComments(params, parser, parserContextFactory, ctx);
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const params = (body as ReviewSearchParams) ?? {};
			return { ctx, catalogName, params };
		},
	});

export default search;
