import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const linkToPage: NotionNodeConverter = (linkNode, ctx) => {
	const idType = linkNode.link_to_page.type;
	const linkData = ctx.pathsMap.get(linkNode.link_to_page[idType]);
	if (!linkData) {
		return ctx.convertUnsupported(linkNode);
	}

	const { title, pagePath } = linkData;
	const resourcePath = ctx.currentPath.getRelativePath(pagePath);

	return {
		type: "paragraph",
		content: [
			{
				type: "text",
				plain_text: title,
				marks: [
					{
						type: "link",
						attrs: {
							href: "",
							resourcePath: resourcePath.toString(),
							hash: "",
							isFile: false,
						},
					},
				],
			},
		],
	};
};

export default linkToPage;
