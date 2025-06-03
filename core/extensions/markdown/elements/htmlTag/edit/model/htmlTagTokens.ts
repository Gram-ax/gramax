import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";

const getHtmlTagAttrs: ParseSpec["getAttrs"] = (tok) => {
	tok.attrs.attributes = tok.attrs.attributes.reduce((acc, attr) => {
		acc[attr.name] = attr.value;
		return acc;
	}, {});

	return tok.attrs;
};

const inlineHtmlTag: ParseSpec = { block: "inlineHtmlTag", getAttrs: getHtmlTagAttrs };

const blockHtmlTag: ParseSpec = { block: "blockHtmlTag", getAttrs: getHtmlTagAttrs };

const blockWithInlineHtmlTag: ParseSpec = { block: "blockWithInlineHtmlTag", getAttrs: getHtmlTagAttrs };

const selfClosingHtmlTag: ParseSpec = { node: "selfClosingHtmlTag", getAttrs: getHtmlTagAttrs };

export default { inlineHtmlTag, blockHtmlTag, blockWithInlineHtmlTag, selfClosingHtmlTag };
