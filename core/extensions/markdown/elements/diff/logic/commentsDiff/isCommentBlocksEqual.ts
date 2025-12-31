import { CommentBlock } from "@core-ui/CommentBlock";

const isCommentBlocksEqual = (comment1: CommentBlock, comment2: CommentBlock) => {
	return JSON.stringify(comment1) === JSON.stringify(comment2);
};

export default isCommentBlocksEqual;
