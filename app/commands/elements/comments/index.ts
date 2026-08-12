import getCommentsByAuthors from "@app/commands/elements/comments/getCommentsByAuthors";
import search from "@app/commands/elements/comments/search";
import deleteComment from "./deleteComment";
import getComment from "./get";
import getAllComments from "./getAll";
import getNewCommentId from "./getNewCommentId";
import updateComment from "./update";

const comments = {
	deleteComment,
	getComment,
	getAllComments,
	updateComment,
	getNewCommentId,
	getCommentsByAuthors,
	search,
};

export default comments;
