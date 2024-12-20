import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const embed: NotionNodeConverter = (embedNode) => {
	const text = embedNode?.[embedNode.type]?.caption?.[0]?.text?.content || " ";
	const url = embedNode?.[embedNode.type]?.url;
	
	return {
		type: "paragraph",
		content: [
			{ type: "text", plain_text: url, href: url },
			{ type: "text", plain_text: " " + text },
		],
	};
};

export default embed;
