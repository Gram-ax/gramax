import { JSONContent } from "@tiptap/core";

const filesFormatterTransformer = (node: JSONContent): JSONContent | JSONContent[] => {
	if (node?.type == "text" && node.marks) {
		for (const mark of node.marks) {
			if (mark.type == "file") {
				mark.type = "link";
				mark.attrs = { ...mark.attrs, hash: "", isFile: true };
			}
		}
	}
	return node;
};

export default filesFormatterTransformer;
