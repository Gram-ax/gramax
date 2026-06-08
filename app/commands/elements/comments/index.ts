import getCommentsByAuthors from "@app/commands/elements/comments/getCommentsByAuthors";
import search from "@app/commands/elements/comments/search";
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
	search,
	copyComment,
};

export default comments;
