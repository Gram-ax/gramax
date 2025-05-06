const blockFieldSchema = {
	group: "block",
	content: "block+",
	isolating: true,
	defining: true,
	attrs: {
		bind: { default: "" },
		placeholder: { default: null },
	},
};

export default blockFieldSchema;
