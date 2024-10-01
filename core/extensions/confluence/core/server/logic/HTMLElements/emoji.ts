import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const emoji: HTMLNodeConverter = (emojiNode) => {
	const emojiId = emojiNode.getAttribute("id");
	if (!emojiId) return null;
	const codePoint = parseInt(emojiId, 16);
	if (isNaN(codePoint)) return null;
	const emojiText = String.fromCodePoint(codePoint);
	if (!emojiText) return null;
	return {
		type: "text",
		text: emojiText,
	};
};

export default emoji;
