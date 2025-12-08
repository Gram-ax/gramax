import { JSONContent } from "@tiptap/react";

const trimEndEmptyParagraphs = (content: JSONContent[]) => {
	if (!Array.isArray(content)) return;

	let maxPasses = content.length;
	while (
		content.length > 0 &&
		content[content.length - 1].type === "paragraph" &&
		(!content[content.length - 1].content || content[content.length - 1].content.length === 0)
	) {
		content.pop();
		maxPasses--;
		if (maxPasses <= 0) break;
	}
};

export default trimEndEmptyParagraphs;
