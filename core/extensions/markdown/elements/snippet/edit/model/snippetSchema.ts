const snippetSchema = {
	group: "block",
	attrs: {
		id: { default: null },
		title: { default: null },
		content: { default: {} },
	},
};

export default snippetSchema;
