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
) => {
	for (const mark of marks) {
		if (mark.type.name !== "comment") continue;
		CommentCounterService.delete(comments, articlePathname, mark.attrs?.comment?.user);
		await FetchService.fetch(apiUrlCreator.deleteComment(mark.attrs.count));
	}
};

export default deleteComments;
