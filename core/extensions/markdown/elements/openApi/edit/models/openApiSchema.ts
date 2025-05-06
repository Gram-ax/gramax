import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const openApiSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	attrs: {
		src: { default: null },
		flag: { default: true },
	},
};

export default openApiSchema;
