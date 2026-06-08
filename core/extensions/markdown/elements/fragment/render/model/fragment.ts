import type { FragmentRenderData } from "@ext/markdown/elements/fragment/edit/model/types";
import type PrivateParserContext from "../../../../core/Parser/ParserContext/PrivateParserContext";
import { type Node, type Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";

export function fragment(context: PrivateParserContext): Schema {
	return {
		render: "Fragment",
		type: SchemaType.block,
		attributes: { id: { type: String } },

		transform: async (node: Node) => {
			const fragmentProvider = context.getCatalog().customProviders.fragmentProvider;
			let fragmentData: FragmentRenderData;
			try {
				const fragment = fragmentProvider.getArticle(node.attributes.id);

				if (fragment) {
					const newContext = context.createContext(fragment);
					fragmentData = await fragmentProvider.getRenderData(node.attributes.id, newContext);
				} else {
					fragmentData = { content: undefined, title: undefined, id: node.attributes.id };
				}
			} catch {
				fragmentData = { content: undefined, title: undefined, id: node.attributes.id };
			}
			if (fragmentData.content) context.fragment.add(node.attributes.id);
			return new Tag("Fragment", fragmentData, fragmentData.content);
		},
	};
}
