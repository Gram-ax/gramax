import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { COMMENT_BLOCK_NODE_TYPES } from "@ext/markdown/elements/comment/edit/model/consts";

const tokensCommentModifier = (tokens: Record<string, ParseSpec>, context?: ParserContext): Record<string, ParseSpec> => {
	for (const [key, tk] of Object.entries(tokens)) {
		const token = tk instanceof Function ? tk(context) : tk;
		if (!COMMENT_BLOCK_NODE_TYPES.includes(key)) continue;
		if (token.getAttrs) {
			const newGetAttrs = token.getAttrs;
			token.getAttrs = async (tok, tokens, i) => {
				const newAttrs = await newGetAttrs(tok, tokens, i);
				const comment = tok?.attrGet ? tok.attrGet("comment") : tok.attrs?.comment ?? null;
				if (comment) newAttrs.comment = comment;
				return newAttrs;
			};
		} else if (token.attrs instanceof Function) {
			const newAttrs = token.attrs;
			token.attrs = (tok) => {
				const attrs = newAttrs(tok);

				const comment = tok?.attrGet ? tok.attrGet("comment") : tok.attrs?.comment ?? null;
				if (comment) attrs.comment = comment;
				return attrs;
			};
		} else if (token.attrs) {
			const comment = token.attrs?.comment ?? null;
			if (comment) token.attrs.comment = comment;
		} else {
			token.getAttrs = (tok) => {
				const comment = tok?.attrGet ? tok.attrGet("comment") : tok.attrs?.comment ?? null;
				if (comment) return { comment };
				return {};
			};
		}
		tokens[key] = token;
	}

	return tokens;
};

export default tokensCommentModifier;
