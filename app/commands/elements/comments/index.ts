import getCommentsByAuthors from "@app/commands/elements/comments/getCommentsByAuthors";
import deleteComment from "./deleteComment";
import getNewCommentId from "./getNewCommentId";
import getComment from "./get";
import updateComment from "./update";
import copyComment from "./copy";

const comments = {
	deleteComment,
	getComment,
	updateComment,
	getNewCommentId,
	getCommentsByAuthors,
	copyComment,
};

export default comments;
