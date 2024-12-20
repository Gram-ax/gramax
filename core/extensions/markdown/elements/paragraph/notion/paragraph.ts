import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";
import { JSONContent } from "@tiptap/core";

const paragraph: NotionNodeConverter = (paragraphNode) => {
	const richText = paragraphNode[paragraphNode.type].rich_text;
	const paragraphs: JSONContent[] = [];
	let currentParagraph: JSONContent[] = [];

	richText.forEach((textItem) => {
		const content = textItem.plain_text;
		const parts = content.split("\n");

		parts.forEach((part, index) => {
			if (part.trim() !== "") {
				currentParagraph.push({
					...textItem,
					text: {
						...textItem.text,
						content: part,
					},
					plain_text: part,
				});
			}

			if (index < parts.length - 1) {
				paragraphs.push({
					type: "gramaxParagraph",
					content: currentParagraph,
				});
				currentParagraph = [];
			}
		});
	});

	if (currentParagraph.length > 0) {
		paragraphs.push({
			type: "gramaxParagraph",
			content: currentParagraph,
		});
	}

	return {
		type: "paragraph",
		content: paragraphs,
	};
};

export default paragraph;
