import UserInfo from "@ext/security/logic/User/UserInfo";
import { Mark } from "@tiptap/pm/model";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import CommentCounterService, {
	type AuthoredCommentsByAuthor,
} from "../../../../../../ui-logic/ContextServices/CommentCounter";

const deleteComments = async (
	marks: Mark[],
	apiUrlCreator: ApiUrlCreator,
	articlePathname: string,
	comments: AuthoredCommentsByAuthor,
	author: UserInfo,
) => {
	for (const mark of marks) {
		if (mark.type.name !== "comment") continue;
		const id = mark.attrs?.count;
		const isEmptyComment = !mark.attrs?.comment && !id;
		if (isEmptyComment) {
			CommentCounterService.delete(comments, articlePathname, author, mark.attrs?.preCount);
		} else {
			CommentCounterService.delete(comments, articlePathname, mark.attrs?.comment?.user, id);
			await FetchService.fetch(apiUrlCreator.deleteComment(mark.attrs.count));
		}
	}
};

export default deleteComments;
