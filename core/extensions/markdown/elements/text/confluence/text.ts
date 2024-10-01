import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const text: NodeConverter = (textNode) => {
	if (!textNode.marks) return textNode;

	const textColorMark = textNode.marks.find((mark) => mark.type === "textColor");

	if (textColorMark) {
		return {
			type: "inlineMd_component",
			attrs: {
				text: `[color:${textColorMark.attrs.color}]${textNode.text}[/color]`,
			},
		};
	}
	const markTypeMapping = {
		underline: { type: "strong" },
		strike: { type: "s" },
		link: (mark) => ({
			type: "link",
			attrs: { href: mark.attrs?.href || "", resourcePath: "", hash: "", isFile: false },
		}),
	};

	textNode.marks = textNode.marks
		.map((mark) => {
			const handler = markTypeMapping[mark.type];
			return handler ? (typeof handler === "function" ? handler(mark) : handler) : mark;
		})
		.filter((mark) => ["strong", "em", "s", "code", "link", "file"].includes(mark.type));

	if (textNode.marks.length === 0) delete textNode.marks;

	return textNode;
};

export default text;
