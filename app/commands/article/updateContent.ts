import { Command, ResponseKind } from "@app/types/Command";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { JSONContent } from "@tiptap/core";

const updateContent: Command<{ ctx: Context; articlePath: Path; catalogName: string; editTree: JSONContent }, void> =
	Command.create({
		path: "article/updateContent",

		kind: ResponseKind.none,

		async do({ ctx, articlePath, catalogName, editTree }) {
			const { formatter, lib, parser, parserContextFactory } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			const fp = lib.getFileProviderByCatalog(catalog);
			const itemRef = fp.getItemRef(articlePath);
			const article = catalog.findItemByItemRef(itemRef) as Article;

			if (!article) return;

			const context = parserContextFactory.fromArticle(article, catalog, ctx.lang, ctx.user.isLogged);

			const markdown = await formatter.render(editTree, context);

			await article.updateContent(markdown);
			article.parsedContent = await parser.parse(article.content, context);
		},

		params(ctx, q, body) {
			const articlePath = new Path(q.path);
			const catalogName = q.catalogName;
			const editTree = body as JSONContent;
			return { ctx, articlePath, catalogName, editTree };
		},
	});

export default updateContent;
