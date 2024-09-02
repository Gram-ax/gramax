import CONFLUENCE_EXTENSION_TYPES from "@ext/confluence/actions/Import/model/confluenceExtensionTypes";
import { JSONContent } from "@tiptap/core";

const convertUnsupportedNode = (UnsupportedNode: JSONContent, currentPageUrl: string): JSONContent[] => {
	return [
		{ type: "paragraph", content: [{ type: "text", text: " " }] },
		{
			type: "unsupported",
			attrs: {
				url: currentPageUrl,
				type:
					CONFLUENCE_EXTENSION_TYPES.includes(UnsupportedNode.type) && UnsupportedNode.attrs?.extensionKey
						? UnsupportedNode.attrs.extensionKey
						: UnsupportedNode.type,
				code: JSON.stringify(UnsupportedNode, null, 1),
			},
		},
	];
};

export default convertUnsupportedNode;
