import { Mark } from "@tiptap/pm/model";
import CommentCounterService from "../../../../../../ui-logic/ContextServices/CommentCounter";

const addComments = (marks: Mark[], articlePathname: string, comments: { [path: string]: number }) => {
	for (const mark of marks) {
		if (mark.type.name !== "comment") return;
		CommentCounterService.add(comments, articlePathname);
	}
};

export default addComments;
