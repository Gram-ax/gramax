import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const questionAnswerSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: `${ElementGroups.paragraph}`,
	draggable: true,
	isolating: true,
	attrs: {
		type: { default: "checkbox" },
		questionId: { default: null },
		answerId: { default: null },
		correct: { default: false },
	},
};

export default questionAnswerSchema;
