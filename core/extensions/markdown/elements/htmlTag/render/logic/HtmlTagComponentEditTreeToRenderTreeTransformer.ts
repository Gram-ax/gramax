import { EditTreeToRenderTreeTransformer } from "@ext/markdown/core/Parser/EditTreeToRenderTree";

const HTML_TAG_COMPONENTS = ["blockHtmlTagComponent", "inlineHtmlTagComponent"];

const HtmlTagComponentEditTreeToRenderTreeTransformer: EditTreeToRenderTreeTransformer = (node) => {
	if (HTML_TAG_COMPONENTS.includes(node.type)) return node.attrs.content;
};

export default HtmlTagComponentEditTreeToRenderTreeTransformer;
