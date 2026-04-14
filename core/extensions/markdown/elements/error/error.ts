import {
	type Node,
	type RenderableTreeNodes,
	type Schema,
	SchemaType,
	Tag,
} from "../../core/render/logic/Markdoc/index";

export const error: Schema = {
	render: "Error",
	attributes: {
		message: { type: String },
		stack: { type: String },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: (node: Node): RenderableTreeNodes => {
		return new Tag("Error", {
			error: { message: node.attributes.message, stack: node.children[0].attributes.content },
		});
	},
};
