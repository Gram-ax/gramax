import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const heading: HTMLNodeConverter = (headingNode) => {
	if (headingNode.textContent)
		return {
			type: "heading",
			attrs: {
				level: parseInt(headingNode.tagName[1]) + 1,
				id: null,
				isCustomId: false,
			},
			content: [
				{
					type: "text",
					text: headingNode.textContent,
				},
			],
		};
};

export default heading;
