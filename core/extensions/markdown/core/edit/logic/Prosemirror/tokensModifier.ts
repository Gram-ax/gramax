/** biome-ignore-all lint/suspicious/noExplicitAny: expected */

import { SCALABLE_NODES } from "@ext/article/extensions/scale/models/Scale";
import type { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import { COMMENT_NODE_TYPES } from "@ext/markdown/elements/comment/edit/model/consts";
import { FLOAT_NODES } from "@ext/markdown/elements/float/edit/model/consts";
import { PROPERTY_NODES } from "@ext/properties/models/consts";

const tokensModifier = (
	tokens: Record<string, ParseSpec>,
	context?: PrivateParserContext,
): Record<string, ParseSpec> => {
	const modifiedTokens = { ...tokens };

	for (const [key, tk] of Object.entries(tokens)) {
		const needsComment = COMMENT_NODE_TYPES.includes(key);
		const needsFloat = FLOAT_NODES.includes(key);
		const needsProperty = PROPERTY_NODES.includes(key);
		const needsScale = SCALABLE_NODES.includes(key);

		if (!needsComment && !needsFloat && !needsProperty && !needsScale) continue;
		const token = tk instanceof Function ? tk(context) : tk;

		if (token.getAttrs) {
			const originalGetAttrs = token.getAttrs;
			modifiedTokens[key] = {
				...token,
				getAttrs: async (tok, tokens, i) => {
					const newAttrs = await originalGetAttrs(tok, tokens, i);

					if (needsComment) {
						const comment = tok?.attrs?.comment ?? null;
						if (comment) {
							newAttrs.comment = comment;
							const commentProvider = context.getCatalog().customProviders.commentProvider;
							const articlePath = context.getArticle().ref.path;
							commentProvider.assignComment(comment.id, articlePath);
						}
					}

					if (needsFloat) {
						const float = tok?.attrs?.float ?? null;
						if (float) newAttrs.float = float;
					}

					if (needsProperty) {
						const property = tok?.attrs?.property ?? null;
						if (property) newAttrs.property = property;
					}

					if (needsScale) {
						const scale = tok?.attrs?.scale ?? null;
						if (scale) newAttrs.scale = scale;
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

					if (needsProperty) {
						const property = tok?.attrs?.property ?? null;
						if (property) attrs.property = property;
					}

					if (needsScale) {
						const scale = tok?.attrs?.scale ?? null;
						if (scale) attrs.scale = scale;
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

					if (needsProperty) {
						const property = tok?.attrs?.property ?? null;
						if (property) result.property = property;
					}

					if (needsScale) {
						const scale = tok?.attrs?.scale ?? null;
						if (scale) result.scale = scale;
					}

					return result;
				},
			};
		}
	}

	return modifiedTokens;
};

export default tokensModifier;
