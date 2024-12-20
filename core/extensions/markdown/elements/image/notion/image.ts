import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const image: NotionNodeConverter = async (imageNode, ctx) => {
	const fileLink = imageNode?.image[imageNode?.image?.type]?.url;
	const resourceName = await ctx.save(fileLink);
	if (!resourceName) return ctx.convertUnsupported(imageNode);

	return {
		type: "image",
		attrs: {
			src: resourceName.newName,
			title: imageNode?.image?.caption?.[0]?.text?.content,
		},
		objects: [],
	};
};

export default image;
