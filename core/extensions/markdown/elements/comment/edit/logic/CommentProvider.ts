import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import generateUniqueID from "@core/utils/generateUniqueID";
import type { Comment, CommentBlock } from "@core-ui/CommentBlock";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { createPrivateParserContext } from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import CommentsCountCache from "@ext/markdown/elements/comment/edit/logic/CommentsCountCache";
import type { AuthoredCommentsByAuthor } from "@ext/markdown/elements/comment/edit/logic/CommentsCounterStore";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import type { Workspace } from "@ext/workspace/Workspace";
import type { JSONContent } from "@tiptap/core";
import assert from "assert";
import * as yaml from "js-yaml";
import type FileProvider from "../../../../../../logic/FileProvider/model/FileProvider";
import Path from "../../../../../../logic/FileProvider/Path/Path";

export type CommentData = Record<string, { stringifiedData: CommentBlock<string>; parsedData: CommentBlock }>;
export type PushArticleCommentFn = (value: string, key: string) => void;

class CommentProvider {
	private _assignedComments: Map<string, Set<string>> = new Map();
	private _comments: Map<string, CommentData> = new Map();
	private _commentCountCache: CommentsCountCache;

	constructor(
		private _fp: FileProvider,
		fs: FileStructure,
		private _catalog: Catalog,
	) {
		this._commentCountCache = new CommentsCountCache(_fp, fs, _catalog, this);
	}

	getNewCommentId(): string {
		return generateUniqueID();
	}

	isAssigned(id: string, articlePath: Path): boolean {
		return this._assignedComments.get(articlePath.value)?.has(id) || false;
	}

	async getComments(articlePath: Path): Promise<CommentData> {
		const articlePathString = articlePath.value;
		assert(this._comments.has(articlePathString), "comments must be parsed");
		return this._comments.get(articlePathString);
	}

	async getComment(id: string, articlePath: Path, context?: ParserContext) {
		const articlePathString = articlePath.value;
		if ((!this._comments.has(articlePathString) || !this._comments.get(articlePathString)?.[id]) && context) {
			await this._parseComments(articlePath, context);
		}

		return this._comments.get(articlePathString)?.[id]?.parsedData;
	}

	assignComment(id: string, articlePath: Path) {
		if (!this._assignedComments.has(articlePath.value)) {
			this._assignedComments.set(articlePath.value, new Set());
		}

		this._assignedComments.get(articlePath.value)?.add(id);
	}

	async saveComment(id: string, comment: CommentBlock, articlePath: Path, context: ParserContext) {
		const articlePathString = articlePath.value;
		const allComments = this._comments.get(articlePathString) || {};

		allComments[id] = {
			stringifiedData: await this._stringify(comment, context),
			parsedData: comment,
		};

		this._comments.set(articlePathString, allComments);
		const allStringifiedComments = Object.fromEntries(
			Object.entries(allComments).map(([id, comment]) => [id, comment.stringifiedData]),
		);
		this._comments.set(articlePathString, allComments);

		const newContent = await this._write(articlePath, allStringifiedComments);
		await this._commentCountCache.updateArticle(articlePath, allComments, newContent);
	}

	async copyComment(
		id: string,
		copyPath: Path,
		articlePath: Path,
		workspace: Workspace,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	): Promise<boolean> {
		const copyCatalogName = copyPath.rootDirectory.value;
		const copyCatalog = await workspace.getCatalog(copyCatalogName, ctx);
		if (!copyCatalog) return false;

		const copyArticle = copyCatalog.findArticle(copyPath.value, []);
		if (!copyArticle) return false;

		const context = await parserContextFactory.fromArticle(
			copyArticle,
			copyCatalog,
			convertContentToUiLanguage(ctx.contentLanguage || copyCatalog.props.language),
		);

		await copyArticle.parsedContent.write(async () => await context.parser.parse(copyArticle.content, context));
		let newComment = await this.getComment(id, copyArticle.ref.path, context);

		if (!newComment) return false;
		const currentCatalog = await workspace.getCatalog(articlePath.rootDirectory.value, ctx);

		const currentArticle = currentCatalog.findItemByItemPath<Article>(articlePath);
		if (!currentArticle) return false;

		const currentContext = await parserContextFactory.fromArticle(
			currentArticle,
			currentCatalog,
			convertContentToUiLanguage(ctx.contentLanguage || currentCatalog.props.language),
		);

		newComment = await this._processLinksInCommentContent(newComment, copyCatalog, context, currentContext);

		await this.saveComment(id, newComment, articlePath, context);
		this._comments.delete(articlePath.value);

		return true;
	}

	async deleteComment(id: string, articlePath: Path) {
		const articlePathString = articlePath.value;
		const allComments = this._comments.get(articlePathString);

		if (!allComments) return;
		if (!allComments[id]) return;

		delete allComments[id];
		this._comments.set(articlePathString, allComments);

		const allStringifiedComments = Object.fromEntries(
			Object.entries(allComments).map(([id, comment]) => [id, comment.stringifiedData]),
		);

		let newContent: string;
		if (Object.keys(allComments).length) newContent = await this._write(articlePath, allStringifiedComments);
		else await this._delete(articlePath);
		await this._commentCountCache.updateArticle(articlePath, allComments, newContent);
	}

	async parseCatalogComments(
		articles: Article[],
		getParserContextFromArticle: (article: Article) => Promise<ParserContext>,
	) {
		await articles.forEachAsync(async (article) => {
			const context = await getParserContextFromArticle(article);
			await this._parseComments(article.ref.path, context);
		});
	}

	async countCommentsRecursively(
		editTree: JSONContent,
		articlePath: Path,
		pushArticleComment: PushArticleCommentFn,
		parserContext?: ParserContext,
	) {
		const existedCommentIds = new Set<string>();

		const countCommentsInTree = async (editTree: JSONContent) => {
			if (!editTree) return;

			const mark = editTree.marks?.find?.((m) => m.type === "comment");
			const attrs = editTree.attrs;
			const id = attrs?.comment?.id || mark?.attrs?.id;

			if (id) {
				const comment = await this.getComment(id, articlePath, parserContext);
				if (!comment || existedCommentIds.has(id)) return;

				const mail = comment.comment.user?.mail;
				if (!mail) return;

				pushArticleComment(mail, id);
				existedCommentIds.add(id);
			}

			await editTree.content?.forEachAsync(countCommentsInTree);
		};

		await countCommentsInTree(editTree);
	}

	async getCommentsByAuthors(parser: MarkdownParser, parserContextFactory: ParserContextFactory, ctx: Context) {
		const contextualCatalog = this._catalog.ctx(ctx);
		const result: AuthoredCommentsByAuthor = {};
		const currentCommentCache = await this._commentCountCache.getCommentsCache();
		const articles = contextualCatalog.getContentItems();
		const newCommentCache: Record<string, Map<string, string>> = {};
		let needSaveCache = false;

		const pushComment = (pathname: string, logicPath: string) => {
			newCommentCache[logicPath] = new Map();

			const pushArticleComment: PushArticleCommentFn = (mail, id) => {
				if (!result[mail]) result[mail] = { total: 0, pathnames: {} };
				if (!result[mail].pathnames[pathname]) result[mail].pathnames[pathname] = [];
				if (result[mail].pathnames[pathname].every((commentId) => commentId !== id)) {
					newCommentCache[logicPath].set(id, mail);
					result[mail].total++;
					result[mail].pathnames[pathname].push(id);
				}
			};
			return pushArticleComment;
		};

		for (const article of articles) {
			const articlePath = article.ref.path.value;
			const pathname = await contextualCatalog.getPathname(article);
			const pushArticleComment = pushComment(pathname, articlePath);

			if (currentCommentCache?.has(articlePath)) {
				const articleCache = currentCommentCache?.get(articlePath);
				if (articleCache) {
					articleCache.comments.forEach(pushArticleComment);
					continue;
				}
			}
			needSaveCache = true;
			const parserContext = await parserContextFactory.fromArticle(
				article,
				contextualCatalog,
				convertContentToUiLanguage(ctx.contentLanguage || contextualCatalog.props.language),
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
				await this.countCommentsRecursively(p?.editTree, article.ref.path, pushArticleComment, parserContext);
			});
		}

		if (needSaveCache) await this._commentCountCache.updateCatalog(newCommentCache);

		return result;
	}

	getFilePath(articlePath: Path) {
		return new Path([articlePath.parentDirectoryPath.toString(), `${articlePath.name}.comments.yaml`]);
	}

	private async _parse(strCommentBlock: CommentBlock<string>, context: ParserContext): Promise<CommentBlock> {
		if (!strCommentBlock) return;
		if (!Array.isArray(strCommentBlock.answers)) strCommentBlock.answers = [];
		return {
			comment: await this._parseComment(strCommentBlock.comment, context),
			answers: await Promise.all(strCommentBlock.answers.map(async (a) => await this._parseComment(a, context))),
		};
	}

	private async _parseComment(comment: Comment<string>, context: ParserContext): Promise<Comment> {
		return {
			...comment,
			content: (await context.parser.editParse(comment.content, createPrivateParserContext(context))).content,
		};
	}

	private async _stringify(commentBlock: CommentBlock, context: ParserContext): Promise<CommentBlock<string>> {
		if (!Array.isArray(commentBlock.answers)) commentBlock.answers = [];
		return {
			comment: await this._stringifyComment(commentBlock.comment, context),
			answers: await Promise.all(commentBlock.answers.map(async (a) => await this._stringifyComment(a, context))),
		};
	}

	private async _stringifyComment(comment: Comment, context: ParserContext): Promise<Comment<string>> {
		return {
			...comment,
			content: await context.formatter.render({ type: "doc", content: [comment.content] }, context),
		};
	}

	private async _parseComments(articlePath: Path, context: ParserContext) {
		const allComments: CommentData = {};
		for (const [id, comment] of Object.entries(await this._read(articlePath))) {
			allComments[id] = {
				stringifiedData: comment,
				parsedData: await this._parse(comment, context),
			};
		}

		this._comments.set(articlePath.value, allComments);
	}

	private async _read(articlePath: Path): Promise<Record<string, CommentBlock<string>>> {
		if (await this._fp.exists(this.getFilePath(articlePath))) {
			const data = await this._fp.read(this.getFilePath(articlePath));
			let result: { [id: string]: CommentBlock<string> };
			try {
				result = yaml.load(data) as { [id: string]: CommentBlock<string> };
			} catch (e) {
				console.error(e);
				result = {};
			}
			return result;
		}
		return {};
	}

	private async _write(articlePath: Path, strCommentBlocks: Record<string, CommentBlock<string>>) {
		const content = yaml.dump(strCommentBlocks);
		await this._fp.write(this.getFilePath(articlePath), content);
		return content;
	}

	private async _delete(articlePath: Path) {
		if (!(await this._fp.exists(this.getFilePath(articlePath)))) return;
		await this._fp.delete(this.getFilePath(articlePath));
	}

	private async _processLinksInCommentContent(
		commentBlock: CommentBlock,
		copyCatalog: ContextualCatalog,
		context: ParserContext,
		newContext: ParserContext,
	): Promise<CommentBlock> {
		const currentArticle = newContext.getArticle();
		const handleLinks = async (node: JSONContent): Promise<JSONContent> => {
			if (node.marks?.some((mark) => mark.type === "link")) {
				const mark = node.marks.find((mark) => mark.type === "link");
				if (!mark) return node;
				const href = mark.attrs?.href;
				if (!href) return node;

				const parsedPath = RouterPathProvider.parsePath(href);
				const targetArticle = copyCatalog.findArticle(parsedPath.itemLogicPath.join("/"), []);
				if (!targetArticle) return node;

				const newLink = await linkCreator.getLink(
					currentArticle.ref.path.getRelativePath(targetArticle.ref.path).value,
					context,
				);

				return {
					...node,
					marks: [
						...node.marks.filter((mark) => mark.type !== "link"),
						{
							type: "link",
							attrs: {
								href: newLink.resourcePath?.value ?? "",
								resourcePath: newLink.resourcePath?.value ?? "",
							},
						},
					],
				};
			}

			if (node.content) {
				return {
					...node,
					content: await node.content.mapAsync(async (node) => await handleLinks(node)),
				};
			}

			return node;
		};

		return {
			comment: {
				...commentBlock.comment,
				content: await commentBlock.comment.content.mapAsync(async (node) => await handleLinks(node)),
			},
			answers: [
				...(await commentBlock.answers.mapAsync(async (answer) => ({
					...answer,
					content: await answer.content.mapAsync(async (node) => await handleLinks(node)),
				}))),
			],
		};
	}
}

export default CommentProvider;
