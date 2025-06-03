import ElementGroups from "@ext/markdown/core/element/ElementGroups";

export default {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: `${ElementGroups.block}+`,
	isolating: true,
	defining: true,
	attrs: {
		bind: { default: "" },
	},
};
