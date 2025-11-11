import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const questionSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: `paragraph block* ${ElementGroups.answer}+`,
	draggable: true,
	isolating: true,
	attrs: {
		id: { default: null },
		type: { default: "one" },
		required: { default: false },
	},
};

export default questionSchema;
