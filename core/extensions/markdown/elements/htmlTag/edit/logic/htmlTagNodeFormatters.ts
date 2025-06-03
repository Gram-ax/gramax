import XmlFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror/schema";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { Node } from "prosemirror-model";

const inlineHtmlTag: NodeSerializerSpec = async (state, node) => {
	state.write(XmlFormatter.openTag(node.attrs.name, node.attrs.attributes));
	await state.renderInline(node);
	state.write(XmlFormatter.closeTag(node.attrs.name));
};

const blockHtmlTag: NodeSerializerSpec = async (state, node) => {
	state.write(`${XmlFormatter.openTag(node.attrs.name, node.attrs.attributes)}\n\n`);
	await state.renderContent(node);
	state.write(XmlFormatter.closeTag(node.attrs.name));
	state.closeBlock(node);
};

const blockWithInlineHtmlTag: NodeSerializerSpec = async (state, node) => {
	state.write(XmlFormatter.openTag(node.attrs.name, node.attrs.attributes));
	await state.renderContent(node);
	state.write(XmlFormatter.closeTag(node.attrs.name));
	state.closeBlock(node);
};

const selfClosingHtmlTag: NodeSerializerSpec = (state, node) => {
	state.write(XmlFormatter.openTag(node.attrs.name, node.attrs.attributes, true));
};

const blockHtmlTagComponent: NodeSerializerSpec = async (state, node, parent) => {
	const content = Node.fromJSON(getSchema(), node.attrs.content);
	await state.render(content, parent, 0);
};

export default {
	inlineHtmlTag,
	blockHtmlTag,
	blockWithInlineHtmlTag,
	selfClosingHtmlTag,
	blockHtmlTagComponent,
	inlineHtmlTagComponent: blockHtmlTagComponent,
};
