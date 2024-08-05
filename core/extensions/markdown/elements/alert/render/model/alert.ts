import Tag from "../../../../core/render/logic/Markdoc/src/ast/tag";
import { Schema, SchemaType } from "@ext/markdown/core/render/logic/Markdoc";

export const alert: Schema = {
	render: "Alert",
	attributes: {
		type: { type: String },
		title: { type: String },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		return new Tag("Alert", node.attributes, await node.transformChildren(config));
	},
};
