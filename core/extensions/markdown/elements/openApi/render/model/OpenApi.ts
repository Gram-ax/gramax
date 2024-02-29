import Path from "../../../../../../logic/FileProvider/Path/Path";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { Node, RenderableTreeNodes, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";

export function OpenApi(context: ParserContext): Schema {
	return {
		render: "OpenApi",
		attributes: {
			src: { type: String },
			flag: { type: String },
		},
		type: SchemaType.block,
		transform: (node: Node): RenderableTreeNodes => {
			context.getResourceManager().set(new Path(node.attributes.src));
			return new Tag("OpenApi", {
				src: node.attributes.src,
				flag: node.attributes.flag == "true",
			});
		},
	};
}
