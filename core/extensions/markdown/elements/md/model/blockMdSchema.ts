const blockMd_component = {
	group: "block",
	marks: "",
	defining: true,
	attrs: {
		text: { default: null },
		tag: { default: null },
	},
};

const blockMd = {
	group: "inline",
	inline: true,
	content: "block+",
	defining: true,
	marks: "",
};

export { blockMd_component, blockMd };
