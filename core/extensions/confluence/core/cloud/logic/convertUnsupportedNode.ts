import CONFLUENCE_EXTENSION_TYPES from "@ext/confluence/core/cloud/model/confluenceExtensionTypes";
import { JSONContent } from "@tiptap/core";

const convertUnsupportedNode = (unsupportedNode: JSONContent, currentPageUrl: string): JSONContent[] => {
	return [
		{ type: "paragraph", content: [{ type: "text", text: " " }] },
		{
			type: "unsupported",
			attrs: {
				url: currentPageUrl,
				type:
					CONFLUENCE_EXTENSION_TYPES.includes(unsupportedNode.type) && unsupportedNode.attrs?.extensionKey
						? unsupportedNode.attrs.extensionKey
						: unsupportedNode.type,
				code: JSON.stringify(unsupportedNode, null, 1),
			},
		},
	];
};

export default convertUnsupportedNode;
