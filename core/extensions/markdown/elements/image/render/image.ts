import { parse } from "@ext/markdown/elements/image/render/logic/imageTransformer";
import Path from "../../../../../logic/FileProvider/Path/Path";
import ParserContext from "../../../core/Parser/ParserContext/ParserContext";
import { Config, Node, Schema, SchemaType, Tag } from "../../../core/render/logic/Markdoc/index";
import linkCreator from "../../link/render/logic/linkCreator";

export function image(context: ParserContext): Schema {
	return {
		render: "Image",
		attributes: {
			src: { type: String },
			alt: { type: String },
			title: { type: String },
			crop: { type: String },
			objects: { type: String },
		},
		type: SchemaType.block,
		transform: async (node: Node, config: Config) => {
			if (!linkCreator.isExternalLink(node.attributes.src))
				context.getResourceManager().set(new Path(node.attributes.src));

			const { crop, objects } = parse(node.attributes.crop ?? "0,0,100,100", node.attributes.objects ?? "[]");
			return new Tag(
				"Image",
				{
					alt: node.attributes.alt,
					src: node.attributes.src,
					title: node.attributes.title,
					objects: objects,
					crop: crop,
				},
				await node.transformChildren(config),
			);
		},
	};
}
