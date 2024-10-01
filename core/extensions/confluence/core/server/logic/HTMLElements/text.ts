import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const text: HTMLNodeConverter = (textNode) => {
	if (!textNode?.textContent) return;

	const tagMapping: Record<string, string> = {
		strong: "strong",
		em: "em",
		s: "s",
		u: "strong",
		sup: "strong",
		sub: "strong",
	};

	const getMarks = (node: HTMLElement): { type: string }[] => {
		const marks: { type: string }[] = [];
		const tagName = node.tagName?.toLowerCase();
		if (tagMapping[tagName]) {
			marks.push({ type: tagMapping[tagName] });
		}
		if (node.children && node.children.length > 0) {
			for (const child of node.children) {
				if (child instanceof HTMLElement) {
					marks.push(...getMarks(child));
				}
			}
		}
		return marks;
	};

	return {
		type: "text",
		text: textNode.textContent,
		marks: getMarks(textNode),
		content: [],
	};
};

export default text;
