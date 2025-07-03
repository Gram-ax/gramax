import ElementGroups from "@ext/markdown/core/element/ElementGroups";

export default {
	group: ElementGroups.block,
	content: `${ElementGroups.block}+`,
	isolating: true,
	defining: true,
	attrs: {
		bind: { default: "" },
	},
};
