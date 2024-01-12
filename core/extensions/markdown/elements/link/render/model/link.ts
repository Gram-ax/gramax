import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { Schema, Tag } from "../../../../core/render/logic/Markdoc/index";
import linkCreator from "../logic/linkCreator";

export function link(context: ParserContext): Schema {
	return {
		render: "Link",
		attributes: {
			href: { type: String },
		},
		transform: async (node, config) => {
			const { href, resourcePath, isFile, hash } = linkCreator.getLink(node.attributes.href, context);
			if (resourcePath) {
				if (isFile) context.getResourceManager().set(resourcePath);
				else context.getLinkManager().set(resourcePath);
			}
			return new Tag(
				"Link",
				{ href: href + (hash ?? ""), isFile, resourcePath: resourcePath?.value ?? "" },
				await node.transformChildren(config),
			);
		},
	};
}
