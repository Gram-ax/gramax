import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";

const iconToken = (context?: ParserContext): ParseSpec => {
	return {
		node: "icon",

		getAttrs: async (tok) => {
			const svg = await context.getCatalog().iconProvider.getIconByCode(tok.attrs.code);
			return { code: tok.attrs.code, svg, color: tok.attrs.color };
		},
	};
};
export default iconToken;
