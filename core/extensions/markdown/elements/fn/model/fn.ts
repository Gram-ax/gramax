import { Node, RenderableTreeNodes, Schema, Tag } from "../../../core/render/logic/Markdoc/index";

export const fn: Schema = {
	render: "Fn",
	attributes: {
		code: { type: String },
		defaultValues: { type: String },
	},
	transform: (node: Node): RenderableTreeNodes => {
		return new Tag("Fn", {
			code: node.attributes.code,
			defaultValues: node.attributes.defaultValues,
		});
	},
};
