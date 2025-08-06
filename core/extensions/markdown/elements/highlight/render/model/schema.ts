import { Schema, Tag } from "../../../../core/render/logic/Markdoc";

export const highlight: Schema = {
	render: "Highlight",
	attributes: {
		color: { type: String },
	},
	selfClosing: false,
	transform: async (node, config) => {
		return new Tag("Highlight", node.attributes, await node.transformChildren(config));
	},
};
