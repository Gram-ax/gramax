import getCommentsByAuthors from "@app/commands/elements/comments/getCommentsByAuthors";
import deleteComment from "./deleteComment";
import getCommentsCount from "./getCommentCount";

const comments = {
	deleteComment,
	getCommentsCount,
	getCommentsByAuthors,
};

export default comments;
