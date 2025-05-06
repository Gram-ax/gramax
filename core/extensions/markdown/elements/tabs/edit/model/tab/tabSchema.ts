import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const tabSchema = {
	group: `${ElementGroups.block}`,
	content: `${ElementGroups.block}+`,
	isolating: true,
	defining: true,
	attrs: {
		name: { default: null },
		icon: { default: null },
		tag: { default: null },
		idx: { default: null },
	},
};

export default tabSchema;
