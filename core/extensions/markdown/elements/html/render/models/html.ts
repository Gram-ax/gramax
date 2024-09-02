import { Schema, SchemaType } from "@ext/markdown/core/render/logic/Markdoc";
import Tag from "../../../../core/render/logic/Markdoc/src/ast/tag";

export const html: Schema = {
	render: "Html",
	attributes: {
		content: { type: String },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: (node) => {
		return new Tag("Html", node.attributes);
	},
};
