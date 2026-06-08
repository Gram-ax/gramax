import type { JSONContent } from "@tiptap/core";

export const extractTextFromJSONContent = (content: JSONContent) => {
	return content
		.map((node) => {
			if (node.type === "text") return node.text;
			return extractTextFromJSONContent(node.content);
		})
		.join("");
};
