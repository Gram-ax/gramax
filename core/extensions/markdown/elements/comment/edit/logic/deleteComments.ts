import { Mark } from "@tiptap/pm/model";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import CommentCounterService from "../../../../../../ui-logic/ContextServices/CommentCounter";

const deleteComments = async (
	marks: Mark[],
	apiUrlCreator: ApiUrlCreator,
	articlePath: string,
	comments: { [path: string]: number },
) => {
	for (const mark of marks) {
		if (mark.type.name !== "comment") return;
		CommentCounterService.delete(comments, articlePath);
		await FetchService.fetch(apiUrlCreator.deleteComment(mark.attrs.count));
	}
};

export default deleteComments;
