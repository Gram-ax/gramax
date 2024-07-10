import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import parseContent from "@core/FileStructue/Article/parseContent";
import { JSONContent } from "@tiptap/core";
import { Command } from "../../../types/Command";

const countComments = (editTree: JSONContent, counts: { [count: number]: boolean } = {}): number => {
	let count = 0;
	const mark = editTree?.marks?.find?.((m) => m.type === "comment");
	if (editTree.type == "text" && mark && !counts?.[mark.attrs?.count]) {
		counts[mark.attrs?.count] = true;
		count++;
	}
	if (editTree.content) editTree.content.forEach((child) => (count += countComments(child, counts)));
	return count;
};

const getNavigationUnresolvedCommentsCount: Command<
	{ ctx: Context; catalogName: string },
	{ [articlePath: string]: number }
> = Command.create({
	path: "comments/getNavigationUnresolvedCommentsCount",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, catalogName }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		if (!catalogName) return;
		const commentsCount: { [articlePath: string]: number } = {};
		const catalog = await workspace.getCatalog(catalogName);
		const articles = catalog.getContentItems();

		for (const article of articles) {
			try {
				await parseContent(article, catalog, ctx, parser, parserContextFactory);
				commentsCount[await catalog.getPathname(article)] = countComments(article.parsedContent.editTree);
			} catch {}
		}
		return commentsCount;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getNavigationUnresolvedCommentsCount;
