import { Comment, CommentBlock } from "@core-ui/CommentBlock";
import * as yaml from "js-yaml";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../../logic/FileProvider/model/FileProvider";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";

class CommentProvider {
	constructor(private _fp: FileProvider, private _articlePath: Path) {}

	getFilePath() {
		return new Path([this._articlePath.parentDirectoryPath.toString(), `${this._articlePath.name}.comments.yaml`]);
	}

	getCount(): string {
		return this._generateGUID();
	}

	async getComment(count: string, context: ParserContext): Promise<CommentBlock> {
		const allComment = await this._read();
		return this._parse(allComment[count], context);
	}

	async saveComment(count: string, comment: CommentBlock, context: ParserContext) {
		const allComment = await this._read();
		allComment[count] = await this._stringify(comment, context);
		await this._write(allComment);
	}

	async deleteComment(count: string) {
		const allComment = await this._read();
		delete allComment[count];
		if (Object.keys(allComment).length) await this._write(allComment);
		else await this._delete();
	}

	private _generateGUID(): string {
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let randomKey = "";
		for (let i = 0; i < 5; i++) {
			randomKey += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		return randomKey;
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

	private async _read(): Promise<{ [count: string]: CommentBlock<string> }> {
		if (await this._fp.exists(this.getFilePath())) {
			const data = await this._fp.read(this.getFilePath());
			let result: { [count: string]: CommentBlock<string> };
			try {
				result = yaml.load(data) as { [count: string]: CommentBlock<string> };
			} catch (e) {
				console.error(e);
				result = {};
			}
			return result;
		} else return {};
	}

	private async _write(strCommentBlocks: { [count: string]: CommentBlock<string> }) {
		await this._fp.write(this.getFilePath(), yaml.dump(strCommentBlocks));
	}

	private async _delete() {
		if (!(await this._fp.exists(this.getFilePath()))) return;
		await this._fp.delete(this.getFilePath());
	}
}

export default CommentProvider;
