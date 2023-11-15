import { Node, RenderableTreeNodes, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";
import getVideoAttrs from "../../logic/getVideoAttrs";

export const video: Schema = {
	render: "Video",
	attributes: {
		path: { type: String },
		title: { type: String },
	},
	type: SchemaType.block,
	transform: (node: Node): RenderableTreeNodes => {
		return new Tag("Video", getVideoAttrs(node.attributes));
	},
};
