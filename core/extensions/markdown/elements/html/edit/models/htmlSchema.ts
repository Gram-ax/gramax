import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const htmlSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	attrs: {
		content: { default: "<p>HTML</p>" },
	},
};

export default htmlSchema;
