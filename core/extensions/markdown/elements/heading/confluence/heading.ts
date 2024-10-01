import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const heading: NodeConverter = (headingNode) => {
	delete headingNode.marks;

	const convertibleLevels = new Set([1, 2, 3]);
	const level = convertibleLevels.has(headingNode.attrs.level) ? headingNode.attrs.level + 1 : 0;

	headingNode.attrs = {
		level: level,
		id: null,
		isCustomId: false,
	};

	if (level === 0) {
		const content = headingNode.content[0];
		if (!content.marks) {
			content.marks = [];
		}

		const hasStrongMark = content.marks.some((mark) => mark.type === "strong");

		if (!hasStrongMark) {
			content.marks.push({ type: "strong" });
		}
	}

	return headingNode;
};

export default heading;
