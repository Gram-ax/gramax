import ElementGroups from "@ext/markdown/core/element/ElementGroups";

export default {
	group: `${ElementGroups.inline}`,
	inline: true,
	draggable: true,
	attrs: {
		src: { default: null },
		alt: { default: null },
		width: { default: null },
		height: { default: null },
	},
};
