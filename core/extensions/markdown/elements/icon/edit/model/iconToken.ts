import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";

const iconToken = (context?: ParserContext): ParseSpec => {
	return {
		node: "icon",

		getAttrs: async (tok) => {
			if (!context) return { code: tok.attrs.code, color: tok.attrs.color };
			const svg = await context.getCatalog().customProviders.iconProvider.getIconByCode(tok.attrs.code);
			return { code: tok.attrs.code, svg, color: tok.attrs.color };
		},
	};
};
export default iconToken;
