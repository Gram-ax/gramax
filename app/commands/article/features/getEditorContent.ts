import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { JSONContent } from "@tiptap/core";

const getEditorContent: Command<{ ctx: Context; articlePath: Path; catalogName: string }, JSONContent> = Command.create(
	{
		path: "article/features/getEditorContent",
		kind: ResponseKind.json,

		async do({ ctx, catalogName, articlePath }) {
			const { parser, parserContextFactory, wm } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			const article: Article = catalog.findItemByItemPath(articlePath);
			if (!article) return null;

			if (await article.parsedContent.isNull()) {
				await parseContent(article, catalog, ctx, parser, parserContextFactory);
			}

			return await article.parsedContent.read((p) => p.editTree);
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const articlePath = new Path(q.articlePath);
			return { ctx, catalogName, articlePath };
		},
	},
);

export default getEditorContent;
