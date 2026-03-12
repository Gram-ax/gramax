import type { JSONContent } from "@tiptap/core";
import type { Content } from "./Article";

export const extractHeader = ({ editTree, renderTree }: Content): string => {
	let header: string = null;

	if (editTree) {
		const content = editTree.content;
		if (content?.[0] && content[0].type === "heading" && content[0].attrs.level === 1) {
			header = content[0].text;
			content.splice(0, 1);
		}
	}

	if (header) return header;

	if (renderTree && typeof renderTree === "object") {
		const content =
			("children" in renderTree && renderTree.children) ||
			(("content" in renderTree && renderTree.content) as JSONContent[]);

		if (content?.[0] && typeof content[0] === "object") {
			if (content[0].name === "Heading" && content[0].attributes.level === 1) {
				header = content[0].children[0];
				content.splice(0, 1);
			}
		}
	}

	return header;
};
