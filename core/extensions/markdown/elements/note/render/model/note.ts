import { Schema, SchemaType } from "@ext/markdown/core/render/logic/Markdoc";
import getNoteAttrs from "@ext/markdown/elements/note/logic/getNoteAttrs";
import Tag from "../../../../core/render/logic/Markdoc/src/ast/tag";

export const note: Schema = {
	render: "Note",
	attributes: {
		type: { type: String },
		title: { type: String },
		collapsed: { type: Boolean, default: false },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		return new Tag("Note", getNoteAttrs(node.attributes), await node.transformChildren(config));
	},
};
