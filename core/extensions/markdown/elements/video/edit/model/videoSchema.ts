import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const videoSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	attrs: {
		title: { default: null },
		path: { default: null },
		isLink: { default: true },
	},
};

export default videoSchema;
