import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";
import convertUnsupportedNode from "@ext/confluence/core/cloud/logic/convertUnsupportedNode";

const mediaInline: NodeConverter = async (mediaInlineNode, ctx) => {
	const articleId = mediaInlineNode?.attrs?.collection?.replace("contentId-", "");
	const resourceName = await ctx.save(mediaInlineNode?.attrs?.id, articleId);
	if (!resourceName) return convertUnsupportedNode(mediaInlineNode, ctx.confluencePageUrl);

	return {
		type: "text",
		marks: [
			{
				type: "file",
				attrs: {
					href: "",
					resourcePath: resourceName.newName,
					hash: "",
					isFile: true,
				},
			},
		],
		text: resourceName.title + " ",
	};
};

export default mediaInline;
