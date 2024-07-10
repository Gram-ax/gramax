import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";
import convertUnsupportedNode from "@ext/confluence/actions/Import/logic/convertUnsupportedNode";

const mediaInline: NodeConverter = async (mediaInlineNode, ctx) => {
	const articleId = mediaInlineNode?.attrs?.collection?.replace("contentId-", "");
	const resourceName = await ctx.save(ctx.articlePath, mediaInlineNode?.attrs?.id, articleId);
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
