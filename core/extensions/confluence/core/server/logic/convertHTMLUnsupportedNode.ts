import { JSONContent } from "@tiptap/core";

const convertHTMLUnsupportedNode = (unsupportedNode: HTMLElement, currentPageUrl: string): JSONContent[] => {
	let tagName = unsupportedNode.tagName?.toLowerCase();

	if (tagName === "ac:structured-macro") {
		tagName = unsupportedNode.getAttribute("ac:name") ?? tagName;
	}
	return [
		{ type: "paragraph", content: [{ type: "text", text: " " }] },
		{
			type: "unsupported",
			attrs: {
				url: currentPageUrl,
				type: tagName?.replace(":", "-"),
				code: unsupportedNode.outerHTML,
				source: "Confluence",
			},
		},
	];
};

export default convertHTMLUnsupportedNode;
