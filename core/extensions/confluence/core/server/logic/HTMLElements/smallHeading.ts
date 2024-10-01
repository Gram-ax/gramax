import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const smallHeading: HTMLNodeConverter = (smallHeadingNode) => {
	return {
		type: "paragraph",
		content: [
			{
				type: "text",
				text: smallHeadingNode.textContent,
				marks: [
					{
						type: "strong",
					},
				],
			},
		],
	};
};

export default smallHeading;
