import getAttrs from "@ext/markdown/elements/diagrams/logic/getAttrs";
import Path from "../../../../../logic/FileProvider/Path/Path";
import PrivateParserContext from "../../../core/Parser/ParserContext/PrivateParserContext";
import { Node, RenderableTreeNodes, Schema, SchemaType, Tag } from "../../../core/render/logic/Markdoc/index";

const getMarkdocModel =
	(name: string) =>
	(context: PrivateParserContext): Schema => {
		return {
			render: name,
			attributes: {
				path: { type: String },
				title: { type: String },
				width: { type: String },
				height: { type: String },
			},
			type: SchemaType.block,
			transform: (node: Node): RenderableTreeNodes => {
				context.getResourceManager().set(new Path(node.attributes.path));
				return new Tag(name, getAttrs(node.attributes));
			},
		};
	};

export default getMarkdocModel;
