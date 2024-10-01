import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const emoji: NodeConverter = (emojiNode) => {
	return {
		type: "text",
		text: emojiNode.attrs.text,
	};
};

export default emoji;
