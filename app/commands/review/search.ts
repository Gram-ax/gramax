import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type { ReviewSearchParams, ReviewSearchResult } from "@ext/review/models/ReviewSearchParams";
import assert from "assert";
import { Command } from "../../types/Command";

const searchReview: Command<{ ctx: Context; catalogName: string; params: ReviewSearchParams }, ReviewSearchResult> =
	Command.create({
		path: "review/search",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

		flags: ["otel-omit-result"],

		async do({ ctx, catalogName, params }) {
			assert(catalogName, "Catalog name is required");

			const workspace = this._app.wm.current();
			const catalog = await workspace.getCatalog(catalogName, ctx);
			assert(catalog, "Catalog not found");

			const commentItems = await this._commands.elements.comments.search.do({ ctx, catalogName, params });

			// future: merge results from other element commands here
			const items = [...commentItems];
			const articlesMap = new Map<string, Article>();

			const articlesTitle = items.reduce(
				(acc, item) => {
					const article =
						articlesMap.get(item.pathname) ||
						catalog.findArticle(RouterPathProvider.getLogicPath(item.pathname), [() => true]);

					if (!articlesMap.has(item.pathname)) {
						articlesMap.set(item.pathname, article);
					}

					acc[item.pathname] = article.getTitle();
					return acc;
				},
				{} as Record<string, string>,
			);

			return { items, articles: articlesTitle };
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const params = (body as ReviewSearchParams) ?? {};
			return { ctx, catalogName, params };
		},
	});

export default searchReview;
