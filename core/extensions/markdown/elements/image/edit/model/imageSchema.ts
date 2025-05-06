import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const imageSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	draggable: true,
	attrs: {
		src: { default: null },
		alt: { default: null },
		crop: { default: null },
		title: { default: null },
		scale: { default: null },
		objects: { default: [] },
		width: { default: null },
		height: { default: null },
	},
};

export default imageSchema;
