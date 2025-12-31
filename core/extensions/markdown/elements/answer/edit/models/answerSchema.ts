import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const questionAnswerSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: `${ElementGroups.paragraph}`,
	draggable: true,
	isolating: true,
	attrs: {
		questionId: { default: null },
		type: { default: "checkbox" },
		answerId: { default: null },
		correct: { default: false },
	},
};

export default questionAnswerSchema;
