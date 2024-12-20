import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const callout: NotionNodeConverter = (calloutNode) => {
	if (calloutNode[calloutNode.type]?.icon?.type === "emoji") {
		const emoji = calloutNode[calloutNode.type].icon.emoji;
		calloutNode[calloutNode.type].rich_text[0].plain_text =
			emoji + calloutNode[calloutNode.type].rich_text[0].plain_text;
	}

	return {
		type: "note",
		attrs: { title: null, type: "info", collapsed: false },
		content: [
			{ type: "paragraph", paragraph: { rich_text: calloutNode[calloutNode.type].rich_text } },
			...calloutNode.content,
		],
	};
};

export default callout;
