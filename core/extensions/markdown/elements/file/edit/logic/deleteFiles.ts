import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { Mark } from "@tiptap/pm/model";

const deleteFiles = async (marks: Mark[], apiUrlCreator: ApiUrlCreator) => {
	for (const mark of marks) {
		if (mark.type.name !== "file") return;
		await FetchService.fetch(apiUrlCreator.deleteArticleResource(mark.attrs.resourcePath));
	}
};

export default deleteFiles;
