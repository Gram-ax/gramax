import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";
import { JSONContent } from "@tiptap/core";

const embed: NotionNodeConverter = (embedNode) => {
	const text = embedNode?.[embedNode.type]?.caption?.[0]?.text?.content;
	const url = embedNode?.[embedNode.type]?.url;

	const content: JSONContent[] = [{ type: "text", plain_text: url, href: url }];

	if (text) {
		content.push({ type: "text", plain_text: " " + text });
	}

	return {
		type: "paragraph",
		content,
	};
};

export default embed;
