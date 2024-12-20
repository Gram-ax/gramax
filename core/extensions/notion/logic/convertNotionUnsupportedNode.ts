import { JSONContent } from "@tiptap/core";

const convertNotionUnsupportedNode = (unsupportedNode: JSONContent, currentPageUrl: string): JSONContent[] => {
	return [
		{
			type: "unsupported",
			attrs: {
				url: currentPageUrl,
				type: unsupportedNode.type,
				code: JSON.stringify(unsupportedNode, null, 1),
				source: "Notion",
			},
		},
	];
};

export default convertNotionUnsupportedNode;
