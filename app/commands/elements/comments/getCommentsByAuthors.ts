import { ResponseKind } from "@app/types/ResponseKind";
import type { Comment } from "@core-ui/CommentBlock";
import type { AuthoredCommentsByAuthor } from "@core-ui/ContextServices/CommentCounter";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import { JSONContent } from "@tiptap/core";
import { Command } from "../../../types/Command";

const countCommentsRecursively = (
	pathname: string,
	editTree: JSONContent,
	out: AuthoredCommentsByAuthor,
	pathnameAdded?: boolean,
) => {
	if (!editTree) return;

	const mark = editTree.marks?.find?.((m) => m.type === "comment")?.attrs?.comment as Comment;
	if (editTree.type == "text" && mark) {
		if (!out[mark.user.mail]) out[mark.user.mail] = { total: 0, pathnames: {} };
		out[mark.user.mail].total++;
		if (!pathnameAdded) {
			out[mark.user.mail].pathnames[pathname] = (out[mark.user.mail].pathnames[pathname] ?? 0) + 1;
			pathnameAdded = true;
		}
	}

	editTree.content?.forEach((child) => countCommentsRecursively(pathname, child, out, pathnameAdded));
};

const getCommentsByAuthors: Command<{ ctx: Context; catalogName: string }, AuthoredCommentsByAuthor> = Command.create({
	path: "comments/getCommentsByAuthors",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, catalogName }) {
		const workspace = this._app.wm.current();
		if (!catalogName) return;

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const articles = catalog.getContentItems();

		const result: AuthoredCommentsByAuthor = {};

		for (const article of articles)
			countCommentsRecursively(await catalog.getPathname(article), article.parsedContent?.editTree, result);

		return result;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getCommentsByAuthors;
