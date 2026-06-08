import type { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import imageToken from "@ext/markdown/elements/image/edit/model/imageToken";

const getHtmlTagAttrs =
	(context): ParseSpec["getAttrs"] =>
	(tok) => {
		tok.attrs.attributes = tok.attrs.attributes.reduce((acc, attr) => {
			acc[attr.name] = attr.value;
			return acc;
		}, {});

		if (tok.attrs.name === "img") {
			tok.attrs.attributes = imageToken(context).getAttrs({ attrs: tok.attrs.attributes }, undefined, undefined);
		}

		return tok.attrs;
	};

export default (context: PrivateParserContext) => {
	const getAttrs = getHtmlTagAttrs(context);

	return {
		inlineHtmlTag: { block: "inlineHtmlTag", getAttrs },
		blockHtmlTag: { block: "blockHtmlTag", getAttrs },
		blockWithInlineHtmlTag: { block: "blockWithInlineHtmlTag", getAttrs },
		selfClosingHtmlTag: { node: "selfClosingHtmlTag", getAttrs },
	};
};
