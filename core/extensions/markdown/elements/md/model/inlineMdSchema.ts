import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const inlineMd_component = {
	group: `${ElementGroups.inline}`,
	atom: true,
	inline: true,
	attrs: {
		text: { default: null },
		tag: { default: null },
	},
};

export default inlineMd_component;
