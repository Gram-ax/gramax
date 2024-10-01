import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";
import convertUnsupportedNode from "@ext/confluence/core/cloud/logic/convertUnsupportedNode";

const blockCard: NodeConverter = (blockCardNode, ctx) => {
	if (!blockCardNode?.attrs?.url) return convertUnsupportedNode(blockCardNode, ctx.confluencePageUrl);
	return {
		type: "paragraph",
		content: [
			{
				type: "text",
				text: blockCardNode.attrs.url.replace(/~/g, "%7E"),
				marks: [
					{
						type: "link",
						attrs: { href: blockCardNode.attrs.url, resourcePath: "", hash: "", isFile: false },
					},
				],
			},
		],
	};
};

export default blockCard;
