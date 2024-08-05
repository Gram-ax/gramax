import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { Schema, Tag } from "../../../../core/render/logic/Markdoc/index";
import linkCreator from "../logic/linkCreator";

export function link(context?: ParserContext): Schema {
	return {
		render: "Link",
		attributes: {
			href: { type: String },
		},
		transform: async (node, config) => {
			if (!context) {
				return new Tag(
					"Link",
					{ href: node.attributes.href, isFile: false, resourcePath: "" },
					await node.transformChildren(config),
				);
			}
			const { href, resourcePath, isFile, hash } = await linkCreator.getLink(node.attributes.href, context);
			if (resourcePath) {
				if (isFile) context.getResourceManager().set(resourcePath);
				else context.getLinkManager().set(resourcePath);
			}
			return new Tag(
				"Link",
				{ href: href + (hash ?? ""), isFile, resourcePath: resourcePath?.value ?? "", hash },
				await node.transformChildren(config),
			);
		},
	};
}
