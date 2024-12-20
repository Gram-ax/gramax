import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const headingMapping: Record<string, string> = {
	heading_1: "2",
	heading_2: "3",
	heading_3: "4",
};

const heading: NotionNodeConverter = (headingNode) => {
	if (headingNode[headingNode.type].is_toggleable)
		return {
			type: "paragraph",
			content: [
				{
					type: headingNode.type,
					[headingNode.type]: { rich_text: headingNode[headingNode.type].rich_text },
				},
				...headingNode.content,
			],
		};

	return {
		type: "heading",
		attrs: {
			level: headingMapping[headingNode.type],
			id: null,
			isCustomId: false,
		},
		content: headingNode[headingNode.type].rich_text,
	};
};

export default heading;
