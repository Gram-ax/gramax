import { ResponseKind } from "@app/types/ResponseKind";
import type { Comment } from "@core-ui/CommentBlock";
import type { AuthoredCommentsByAuthor } from "@core-ui/ContextServices/CommentCounter";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import { JSONContent } from "@tiptap/core";
import { Command } from "../../../types/Command";

const countCommentsRecursively = (pathname: string, editTree: JSONContent, out: AuthoredCommentsByAuthor) => {
	const countCommentsInTree = (editTree: JSONContent) => {
		if (!editTree) return;

		const mark = editTree.marks?.find?.((m) => m.type === "comment");
		const { comment, count: id } = (mark?.attrs ?? {}) as { comment: Comment; count: string };

		if (editTree.type == "text" && comment) {
			if (!out[comment.user.mail]) out[comment.user.mail] = { total: 0, pathnames: {} };
			if (!out[comment.user.mail].pathnames[pathname]) out[comment.user.mail].pathnames[pathname] = [];
			if (out[comment.user.mail].pathnames[pathname].every((commentId) => commentId !== id)) {
				out[comment.user.mail].total++;
				out[comment.user.mail].pathnames[pathname].push(id);
			}
		}

		editTree.content?.forEach((child) => countCommentsInTree(child));
	};
	countCommentsInTree(editTree);
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

		for (const article of articles) {
			await article.parsedContent.read(async (p) => {
				countCommentsRecursively(await catalog.getPathname(article), p?.editTree, result);
			});
		}

		return result;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getCommentsByAuthors;
