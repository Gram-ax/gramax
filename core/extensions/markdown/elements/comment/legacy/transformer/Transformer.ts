import { Comment, CommentBlock } from "@core-ui/CommentBlock";
import { JSONContent } from "@tiptap/core";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { dateNormalize, dateScreening } from "../../../../core/edit/logic/Formatter/Utils/Date";

export const transformNodeToModel = async (node: any, context: ParserContext): Promise<CommentBlock> => {
	const newNode = JSON.parse(JSON.stringify(node));

	const answers = (
		await Promise.all(
			newNode.content.map(async (c, idx) => {
				if (c.type === "answer") {
					newNode.content[idx] = null;
					return await _getCommentFromNode(c, context);
				}
			}),
		)
	).filter((c) => c);

	newNode.content = newNode.content.filter((x: any) => x);

	const comment = await _getCommentFromNode(
		{
			type: "comment_old",
			attrs: { ...newNode.attrs },
			content: newNode.content,
		},
		context,
	);

	return {
		comment,
		answers,
	};
};

export const transformModelToNode = (model: CommentBlock): JSONContent => {
	if (!model?.comment) return null;
	if (!Array.isArray(model.answers)) model.answers = [];

	const node = _getNodeFromComment(model.comment, true);
	const answerNodes = model.answers.map((answer: Comment) => _getNodeFromComment(answer, false));
	node.content.push(...answerNodes);
	return node;
};

const _getCommentFromNode = async (node: any, context: ParserContext): Promise<Comment> => {
	return {
		user: {
			mail: node.attrs?.mail,
			name: (await context.getUserByMail(node.attrs.mail))?.name,
		},
		dateTime: dateNormalize(node.attrs.dateTime),
		content: node.content,
	};
};

const _getNodeFromComment = (comment: Comment, isComment: boolean) => {
	const node = {
		type: isComment ? "comment_old" : "answer",
		attrs: {
			mail: comment.user.mail,
			dateTime: dateScreening(comment.dateTime),
			isResolved: false,
		},
		content: comment.content,
	};
	if (!isComment) delete node.attrs.isResolved;

	return node;
};
