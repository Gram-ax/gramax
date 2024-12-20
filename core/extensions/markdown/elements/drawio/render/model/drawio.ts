import Path from "../../../../../../logic/FileProvider/Path/Path";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { Node, RenderableTreeNodes, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";

export function drawio(context: ParserContext): Schema {
	return {
		render: "Drawio",
		attributes: { path: { type: String }, title: { type: String }, width: { type: String }, height: { type: String } },
		type: SchemaType.block,
		transform: (node: Node): RenderableTreeNodes => {
			context.getResourceManager().set(new Path(node.attributes.path));
			return new Tag("Drawio", {
				src: node.attributes.path,
				title: node.attributes.title,
				width: node.attributes.width,
				height: node.attributes.height,
			});
		},
	};
}
