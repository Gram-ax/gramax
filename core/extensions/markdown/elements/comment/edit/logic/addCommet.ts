import { Mark } from "@tiptap/pm/model";
import CommentCounterService, {
	type AuthoredCommentsByAuthor,
} from "../../../../../../ui-logic/ContextServices/CommentCounter";
import type UserInfo from "@ext/security/logic/User/UserInfo";

const addComments = (marks: Mark[], articlePathname: string, comments: AuthoredCommentsByAuthor, author: UserInfo) => {
	for (const mark of marks) {
		if (mark.type.name !== "comment") continue;
		CommentCounterService.add(comments, articlePathname, author);
	}
};

export default addComments;
