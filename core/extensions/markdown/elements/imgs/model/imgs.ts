import Path from "../../../../../logic/FileProvider/Path/Path";
import ParserContext from "../../../core/Parser/ParserContext/ParserContext";
import { Node, RenderableTreeNodes, Schema, Tag } from "../../../core/render/logic/Markdoc";

export function imgs(context: ParserContext, orientation: string): Schema {
	return {
		render: `Img-${orientation}`,
		attributes: {
			imageFirst: { type: String },
			imageSecond: { type: String },
		},
		transform: (node: Node): RenderableTreeNodes => {
			const images = [node.attributes.imageFirst, node.attributes.imageSecond].filter((i) => i);
			images.forEach((image) => context.getResourceManager().set(new Path(image)));

			return new Tag(`Img-${orientation}`, { postfix: `${orientation}`, images: images });
		},
	};
}
