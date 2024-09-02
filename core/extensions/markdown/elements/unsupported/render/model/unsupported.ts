import { Schema, SchemaType } from "@ext/markdown/core/render/logic/Markdoc";
import Tag from "../../../../core/render/logic/Markdoc/src/ast/tag";

export const unsupported: Schema = {
	render: "Unsupported",
	attributes: {
		url: { type: String },
		type: { type: String },
		code: { type: String },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: (node) => {
		return new Tag("Unsupported", node.attributes);
	},
};
