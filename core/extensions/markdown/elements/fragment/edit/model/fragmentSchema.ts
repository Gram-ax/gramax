import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const fragmentSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	attrs: {
		id: { default: null },
		title: { default: null },
		content: { default: {} },
	},
};

export default fragmentSchema;
