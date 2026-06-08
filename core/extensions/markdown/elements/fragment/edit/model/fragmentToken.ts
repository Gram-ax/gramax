import type { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import type { FragmentRenderData } from "@ext/markdown/elements/fragment/edit/model/types";

const fragmentToken = (context?: PrivateParserContext): ParseSpec => {
	return {
		node: "fragment",
		getAttrs: async (tok) => {
			if (!context) return { content: null, title: null, id: tok.attrs.id };
			const fragmentProvider = context.getCatalog().customProviders.fragmentProvider;
			let fragmentData: FragmentRenderData;
			try {
				const fragment = fragmentProvider.getArticle(tok.attrs.id);
				if (!fragment) return { content: null, title: null, id: tok.attrs.id };

				const newContext = context.createContext(fragment);
				fragmentData = await fragmentProvider.getRenderData(tok.attrs.id, newContext);
				context.fragment.add(tok.attrs.id);
			} catch {
				fragmentData = { content: null, title: null, id: tok.attrs.id };
			}
			return fragmentData;
		},
	};
};
export default fragmentToken;
