import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { COMMENT_NODE_TYPES } from "@ext/markdown/elements/comment/edit/model/consts";
import { FLOAT_NODES } from "@ext/markdown/elements/float/edit/model/consts";

const tokensModifier = (tokens: Record<string, ParseSpec>, context?: ParserContext): Record<string, ParseSpec> => {
	const modifiedTokens = { ...tokens };

	for (const [key, tk] of Object.entries(tokens)) {
		const needsComment = COMMENT_NODE_TYPES.includes(key);
		const needsFloat = FLOAT_NODES.includes(key);

		if (!needsComment && !needsFloat) continue;
		const token = tk instanceof Function ? tk(context) : tk;

		if (token.getAttrs) {
			const originalGetAttrs = token.getAttrs;
			modifiedTokens[key] = {
				...token,
				getAttrs: async (tok, tokens, i) => {
					const newAttrs = await originalGetAttrs(tok, tokens, i);

					if (needsComment) {
						const comment = tok?.attrs?.comment ?? null;
						if (comment) newAttrs.comment = comment;
					}

					if (needsFloat) {
						const float = tok?.attrs?.float ?? null;
						if (float) newAttrs.float = float;
					}

					return newAttrs;
				},
			};
		} else if (token.attrs instanceof Function) {
			const originalAttrs = token.attrs;

			modifiedTokens[key] = {
				...token,
				attrs: (tok) => {
					const attrs = originalAttrs(tok);

					if (needsComment) {
						const comment = tok?.attrs?.comment ?? null;
						if (comment) attrs.comment = comment;
					}

					if (needsFloat) {
						const float = tok?.attrs?.float ?? null;
						if (float) attrs.float = float;
					}

					return attrs;
				},
			};
		} else {
			modifiedTokens[key] = {
				...token,
				getAttrs: (tok) => {
					const result: any = {};

					if (needsComment) {
						const comment = tok?.attrs?.comment ?? null;
						if (comment) result.comment = comment;
					}

					if (needsFloat) {
						const float = tok?.attrs?.float ?? null;
						if (float) result.float = float;
					}

					return result;
				},
			};
		}
	}

	return modifiedTokens;
};

export default tokensModifier;
