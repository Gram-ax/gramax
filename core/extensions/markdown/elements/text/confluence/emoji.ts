import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const emoji: NodeConverter = (emojiNode) => {
	return {
		type: "text",
		text: emojiNode.attrs.text,
	};
};

export default emoji;
