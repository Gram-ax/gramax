import type { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";

const fragmentLinkToken = (context?: PrivateParserContext): ParseSpec => ({
	mark: "fragment-link",
	getAttrs: (tok) => {
		if (tok.attrs.id) context?.fragment.add(tok.attrs.id);
		return tok.attrs;
	},
});

export default fragmentLinkToken;
