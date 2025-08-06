import { Comment, CommentBlock } from "@core-ui/CommentBlock";
import * as yaml from "js-yaml";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../../logic/FileProvider/model/FileProvider";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import generateUniqueID from "@core/utils/generateUniqueID";

type CommentData = Record<string, { stringifiedData: CommentBlock<string>; parsedData: CommentBlock }>;

class CommentProvider {
	private _comments: Map<string, CommentData> = new Map();
	constructor(private _fp: FileProvider) {}

	getFilePath(articlePath: Path) {
		return new Path([articlePath.parentDirectoryPath.toString(), `${articlePath.name}.comments.yaml`]);
	}

	getNewCommentId(): string {
		return generateUniqueID();
	}

	async getComment(id: string, articlePath: Path, context: ParserContext): Promise<CommentBlock> {
		const articlePathString = articlePath.value;
		if (this._comments.has(articlePathString) && this._comments.get(articlePathString)?.[id])
			return this._comments.get(articlePathString)[id]?.parsedData;

		const allComments: CommentData = {};
		for (const [id, comment] of Object.entries(await this._read(articlePath))) {
			allComments[id] = {
				stringifiedData: comment,
				parsedData: await this._parse(comment, context),
			};
		}

		this._comments.set(articlePathString, allComments);
		return allComments[id]?.parsedData;
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

	private async _parse(strCommentBlock: CommentBlock<string>, context: ParserContext): Promise<CommentBlock> {
		if (!strCommentBlock) return;
		if (!Array.isArray(strCommentBlock.answers)) strCommentBlock.answers = [];
		return {
			comment: await this._parseComment(strCommentBlock.comment, context),
			answers: await Promise.all(strCommentBlock.answers.map(async (a) => await this._parseComment(a, context))),
		};
	}

	private async _parseComment(comment: Comment<string>, context: ParserContext): Promise<Comment> {
		return { ...comment, content: (await context.parser.editParse(comment.content, context)).content };
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
		} else return {};
	}

	private async _write(articlePath: Path, strCommentBlocks: Record<string, CommentBlock<string>>) {
		await this._fp.write(this.getFilePath(articlePath), yaml.dump(strCommentBlocks));
	}

	private async _delete(articlePath: Path) {
		if (!(await this._fp.exists(this.getFilePath(articlePath)))) return;
		await this._fp.delete(this.getFilePath(articlePath));
	}
}

export default CommentProvider;
