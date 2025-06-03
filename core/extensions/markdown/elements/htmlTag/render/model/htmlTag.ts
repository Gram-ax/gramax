import { Schema, SchemaType } from "@ext/markdown/core/render/logic/Markdoc";
import Tag from "../../../../core/render/logic/Markdoc/src/ast/tag";

export const inlineHtmlTag: Schema = {
	render: "InlineHtmlTag",
	attributes: {
		name: { type: String },
		attributes: { type: Array },
	},
	selfClosing: false,
	type: SchemaType.inline,
	transform: async (node, config) => {
		return new Tag("inlineHtmlTag", node.attributes, await node.transformChildren(config));
	},
};

export const blockHtmlTag: Schema = {
	render: "BlockHtmlTag",
	attributes: {
		name: { type: String },
		attributes: { type: Array },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		return new Tag("blockHtmlTag", node.attributes, await node.transformChildren(config));
	},
};

export const blockWithInlineHtmlTag: Schema = {
	render: "BlockWithInlineHtmlTag",
	attributes: {
		name: { type: String },
		attributes: { type: Array },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		return new Tag("blockWithInlineHtmlTag", node.attributes, await node.transformChildren(config));
	},
};

export const selfClosingHtmlTag: Schema = {
	render: "SelfClosingHtmlTag",
	attributes: {
		name: { type: String },
		attributes: { type: Array },
	},
	selfClosing: true,
	type: SchemaType.inline,
	transform: async (node, config) => {
		return new Tag("selfClosingHtmlTag", node.attributes, await node.transformChildren(config));
	},
};

export const inlineHtmlTagComponent: Schema = {
	render: "inlineHtmlTagComponent",
	attributes: {
		content: { type: Object },
	},
	selfClosing: true,
	type: SchemaType.inline,
	transform: async (node, config) => {
		return new Tag("inlineHtmlTagComponent", node.attributes, await node.transformChildren(config));
	},
};

export const blockHtmlTagComponent: Schema = {
	render: "blockHtmlTagComponent",
	attributes: {
		content: { type: Object },
	},
	selfClosing: true,
	type: SchemaType.inline,
	transform: async (node, config) => {
		return new Tag("blockHtmlTagComponent", node.attributes, await node.transformChildren(config));
	},
};
