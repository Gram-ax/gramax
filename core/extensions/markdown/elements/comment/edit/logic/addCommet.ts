import { Mark } from "@tiptap/pm/model";
import CommentCounterService, {
	type AuthoredCommentsByAuthor,
} from "../../../../../../ui-logic/ContextServices/CommentCounter";
import type UserInfo from "@ext/security/logic/User/UserInfo";

const addComments = (marks: Mark[], articlePathname: string, comments: AuthoredCommentsByAuthor, author: UserInfo) => {
	for (const mark of marks) {
		if (mark.type.name !== "comment") continue;
		const user = mark?.attrs?.comment?.user ?? author;
		const newId = mark?.attrs?.preCount;
		if (comments[user.mail]?.pathnames[articlePathname]?.some((id) => id === newId)) return;
		CommentCounterService.add(comments, articlePathname, mark?.attrs?.comment?.user ?? author, newId);
	}
};

export default addComments;
