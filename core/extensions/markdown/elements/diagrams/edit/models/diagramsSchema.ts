import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const diagramsSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	draggable: true,
	attrs: {
		src: { default: null },
		title: { default: null },
		content: { default: null },
		diagramName: { default: null },
		width: { default: null },
		height: { default: null },
	},
};

export default diagramsSchema;
