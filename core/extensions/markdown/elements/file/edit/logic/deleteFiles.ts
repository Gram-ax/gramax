import { Mark } from "@tiptap/pm/model";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";

const deleteFiles = async (marks: Mark[], resourceService: ResourceServiceType) => {
	for (const mark of marks) {
		if (mark.type.name !== "file") continue;
		await resourceService.deleteResource(mark.attrs.resourcePath);
	}
};

export default deleteFiles;
