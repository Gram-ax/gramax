import getCommentsByAuthors from "@app/commands/elements/comments/getCommentsByAuthors";
import copyComment from "./copy";
import deleteComment from "./deleteComment";
import getComment from "./get";
import getNewCommentId from "./getNewCommentId";
import updateComment from "./update";

const comments = {
	deleteComment,
	getComment,
	updateComment,
	getNewCommentId,
	getCommentsByAuthors,
	copyComment,
};

export default comments;
