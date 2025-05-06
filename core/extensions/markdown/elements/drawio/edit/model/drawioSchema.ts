import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const drawioSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	draggable: true,
	attrs: {
		src: { default: null },
		title: { default: null },
		width: { default: null },
		height: { default: null },
	},
};

export default drawioSchema;
