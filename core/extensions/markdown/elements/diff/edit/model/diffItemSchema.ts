const diffItemSchema = {
	group: "block",
	content: "inline*",
	attrs: {
		diff_node_type: { default: null },
		diff_attrs: { default: null },
	},
};

export default diffItemSchema;
