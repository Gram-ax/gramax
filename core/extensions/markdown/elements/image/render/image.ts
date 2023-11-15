import Path from "../../../../../logic/FileProvider/Path/Path";
import ParserContext from "../../../core/Parser/ParserContext/ParserContext";
import { Config, Node, Schema, SchemaType, Tag } from "../../../core/render/logic/Markdoc/index";
import linkCreator from "../../link/render/logic/linkCreator";

export function image(context: ParserContext): Schema {
	return {
		render: "Image",
		attributes: { alt: { type: String }, src: { type: String }, title: { type: String } },
		type: SchemaType.block,
		transform: async (node: Node, config: Config) => {
			if (!linkCreator.isExternalLink(node.attributes.src))
				context.getResourceManager().set(new Path(node.attributes.src));
			return new Tag(
				"Image",
				{ alt: node.attributes.alt, src: node.attributes.src, title: node.attributes.title },
				await node.transformChildren(config),
			);
		},
	};
}
