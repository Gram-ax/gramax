import { Schema, Tag } from "../../../../core/render/logic/Markdoc";

export const color: Schema = {
	render: "Color",
	attributes: {
		color: { type: String },
	},
	selfClosing: false,
	transform: async (node, config) => {
		return new Tag("Color", node.attributes, await node.transformChildren(config));
	},
};
