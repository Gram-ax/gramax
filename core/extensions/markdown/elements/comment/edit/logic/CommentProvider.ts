import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import generateUniqueID from "@core/utils/generateUniqueID";
import type { Comment, CommentBlock } from "@core-ui/CommentBlock";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { createPrivateParserContext } from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import type { Workspace } from "@ext/workspace/Workspace";
import type { JSONContent } from "@tiptap/core";
import assert from "assert";
import * as yaml from "js-yaml";
import type FileProvider from "../../../../../../logic/FileProvider/model/FileProvider";
import Path from "../../../../../../logic/FileProvider/Path/Path";

type CommentData = Record<string, { stringifiedData: CommentBlock<string>; parsedData: CommentBlock }>;

class CommentProvider {
	private _assignedComments: Map<string, Set<string>> = new Map();
	private _comments: Map<string, CommentData> = new Map();
	constructor(private _fp: FileProvider) {}

	getFilePath(articlePath: Path) {
		return new Path([articlePath.parentDirectoryPath.toString(), `${articlePath.name}.comments.yaml`]);
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

	async getComment(id: string, articlePath: Path, context?: ParserContext): Promise<CommentBlock> {
		const articlePathString = articlePath.value;
		if (this._comments.has(articlePathString) && this._comments.get(articlePathString)?.[id]) {
			return this._comments.get(articlePathString)[id]?.parsedData;
		}

		await this._parseComments(articlePath, context);
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
		await this._write(articlePath, allStringifiedComments);
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
			ctx.user.isLogged,
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
			ctx.user.isLogged,
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

		if (Object.keys(allComments).length) await this._write(articlePath, allStringifiedComments);
		else await this._delete(articlePath);
	}

	async parseCatalogCommenrs(
		articles: Article[],
		getParserContextFromArticle: (article: Article) => Promise<ParserContext>,
	) {
		await articles.forEachAsync(async (article) => {
			const context = await getParserContextFromArticle(article);
			await this._parseComments(article.ref.path, context);
		});
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
		await this._fp.write(this.getFilePath(articlePath), yaml.dump(strCommentBlocks));
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
