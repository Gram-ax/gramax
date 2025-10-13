import { ResponseKind } from "@app/types/ResponseKind";
import type { AuthoredCommentsByAuthor } from "@core-ui/ContextServices/CommentCounter";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import CommentProvider from "@ext/markdown/elements/comment/edit/logic/CommentProvider";
import { JSONContent } from "@tiptap/core";
import assert from "assert";
import { Command } from "../../../types/Command";

const countCommentsRecursively = async (
	pathname: string,
	editTree: JSONContent,
	out: AuthoredCommentsByAuthor,
	commentProvider: CommentProvider,
	parserContext: ParserContext,
	articlePath: Path,
) => {
	const existedCommentIds = new Set<string>();

	const countCommentsInTree = async (editTree: JSONContent) => {
		if (!editTree) return;

		const mark = editTree.marks?.find?.((m) => m.type === "comment");
		const attrs = editTree.attrs;
		const id = attrs?.comment?.id || mark?.attrs?.id;

		if (id) {
			const comment = await commentProvider.getComment(id, articlePath, parserContext);

			if (!comment || existedCommentIds.has(id)) return;
			const mail = comment.comment.user?.mail;
			if (!mail) return;

			if (!out[mail]) out[mail] = { total: 0, pathnames: {} };
			if (!out[mail].pathnames[pathname]) out[mail].pathnames[pathname] = [];
			if (out[mail].pathnames[pathname].every((commentId) => commentId !== id)) {
				out[mail].total++;
				out[mail].pathnames[pathname].push(id);
			}

			existedCommentIds.add(id);
		}

		await editTree.content?.forEachAsync(countCommentsInTree);
	};

	await countCommentsInTree(editTree);
};

const getCommentsByAuthors: Command<{ ctx: Context; catalogName: string }, AuthoredCommentsByAuthor> = Command.create({
	path: "comments/getCommentsByAuthors",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, catalogName }) {
		const { parserContextFactory, parser } = this._app;
		const workspace = this._app.wm.current();
		if (!catalogName) return;

		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog, "Catalog not found");
		const articles = catalog.getContentItems();

		const result: AuthoredCommentsByAuthor = {};

		for (const article of articles) {
			const parserContext = await parserContextFactory.fromArticle(
				article,
				catalog,
				convertContentToUiLanguage(ctx.contentLanguage || catalog.props.language),
				ctx.user.isLogged,
			);

			if (await article.parsedContent.isNull()) {
				try {
					const parsedContent = await parser.parse(article.content, parserContext);
					await article.parsedContent.write(() => parsedContent);
				} catch {
					continue;
				}
			}

			await article.parsedContent.read(async (p) => {
				const commentProvider = catalog.customProviders.commentProvider;

				await countCommentsRecursively(
					await catalog.getPathname(article),
					p?.editTree,
					result,
					commentProvider,
					parserContext,
					article.ref.path,
				);
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
