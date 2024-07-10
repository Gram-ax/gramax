import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";
import convertUnsupportedNode from "@ext/confluence/actions/Import/logic/convertUnsupportedNode";

const mediaSingle: NodeConverter = async (mediaSingleNode, ctx) => {
	const articleId = mediaSingleNode?.content[0]?.attrs?.collection?.replace("contentId-", "");
	const resourceName = await ctx.save(ctx.articlePath, mediaSingleNode?.content[0]?.attrs?.id, articleId);
	if (!resourceName) return convertUnsupportedNode(mediaSingleNode, ctx.confluencePageUrl);

	return {
		type: "image",
		attrs: {
			src: resourceName.newName,
			title: mediaSingleNode?.content[1]?.content[0]?.text,
		},
		objects: [],
	};
};

export default mediaSingle;
