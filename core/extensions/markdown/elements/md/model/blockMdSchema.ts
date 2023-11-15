const blockMd_component = {
	group: "block",
	marks: "",
	defining: true,
	content: "text*",
	attrs: {
		text: { default: null },
		tag: { default: null },
	},
};

const blockMd = {
	group: "block",
	content: "block+",
	defining: true,
	marks: "",
};

export { blockMd_component, blockMd };
