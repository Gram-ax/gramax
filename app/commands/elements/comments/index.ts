import getCommentsByAuthors from "@app/commands/elements/comments/getCommentsByAuthors";
import deleteComment from "./deleteComment";
import getNewCommentId from "./getNewCommentId";
import getComment from "./get";
import updateComment from "./update";

const comments = {
	deleteComment,
	getComment,
	updateComment,
	getNewCommentId,
	getCommentsByAuthors,
};

export default comments;
