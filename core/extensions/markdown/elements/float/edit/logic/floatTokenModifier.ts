import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { FLOAT_NODES } from "@ext/markdown/elements/float/edit/model/consts";

const tokensFloatModifier = (tokens: Record<string, ParseSpec>, context?: ParserContext): Record<string, ParseSpec> => {
	for (const [key, tk] of Object.entries(tokens)) {
		const token = tk instanceof Function ? tk(context) : tk;
		if (!FLOAT_NODES.includes(key)) continue;
		if (token.getAttrs) {
			const newGetAttrs = token.getAttrs;
			token.getAttrs = async (tok, tokens, i) => {
				const newAttrs = await newGetAttrs(tok, tokens, i);
				const float = tok?.attrGet ? tok.attrGet("float") : tok.attrs?.float ?? null;
				if (float) newAttrs.float = float;
				return newAttrs;
			};
		} else if (token.attrs instanceof Function) {
			const newAttrs = token.attrs;
			token.attrs = (tok) => {
				const attrs = newAttrs(tok);

				const float = tok?.attrGet ? tok.attrGet("float") : tok.attrs?.float ?? null;
				if (float) attrs.float = float;
				return attrs;
			};
		} else if (token.attrs) {
			const float = token.attrs?.float ?? null;
			if (float) token.attrs.float = float;
		} else {
			token.getAttrs = (tok) => {
				const float = tok?.attrGet ? tok.attrGet("float") : tok.attrs?.float ?? null;
				if (float) return { ...tok?.attrs, float };
				return {};
			};
		}
		tokens[key] = token;
	}

	return tokens;
};

export default tokensFloatModifier;
