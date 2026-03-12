import { getRenderSrc } from "@ext/markdown/elements/image/edit/model/imageToken";
import { parse } from "@ext/markdown/elements/image/render/logic/imageTransformer";
import Path from "../../../../../logic/FileProvider/Path/Path";
import type PrivateParserContext from "../../../core/Parser/ParserContext/PrivateParserContext";
import { type Config, type Node, type Schema, SchemaType, Tag } from "../../../core/render/logic/Markdoc/index";
import linkCreator from "../../link/render/logic/linkCreator";

export function image(context: PrivateParserContext): Schema {
	return {
		render: "Image",
		attributes: {
			src: { type: String },
			alt: { type: String },
			title: { type: String },
			crop: { type: String },
			scale: { type: String },
			objects: { type: String },
			width: { type: String },
			height: { type: String },
			float: { type: String },
			renderSrc: { type: String },
		},
		type: SchemaType.block,
		transform: async (node: Node, config: Config) => {
			const isExternalLink = linkCreator.isExternalLink(node.attributes.src);
			if (!isExternalLink) context.getResourceManager().set(new Path(node.attributes.src));
			const renderSrc = isExternalLink ? node.attributes.src : getRenderSrc(context, node.attributes.src);

			const { crop, objects, scale, width, height, float } = parse(
				node.attributes.crop ?? "0,0,100,100",
				node.attributes.scale ?? null,
				node.attributes.objects ?? "[]",
				node.attributes.width,
				node.attributes.height,
				node.attributes.float,
			);

			return new Tag(
				"Image",
				{
					alt: node.attributes.alt,
					src: node.attributes.src,
					title: node.attributes.title,
					objects: objects,
					scale: scale,
					crop: crop,
					width: width,
					height: height,
					float: float,
					renderSrc,
				},
				await node.transformChildren(config),
			);
		},
	};
}
