import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import { NodeSpec } from "@tiptap/pm/model";

const htmlTagSchema = {
	attrs: {
		name: { default: null },
		attributes: { default: null },
	},
};

const inlineHtmlTag: NodeSpec = {
	group: ElementGroups.inline,
	inline: true,
	content: `${ElementGroups.inline}*`,
	...htmlTagSchema,
};

const blockHtmlTag: NodeSpec = {
	group: ElementGroups.block,
	inline: false,
	content: `${ElementGroups.block}*`,
	...htmlTagSchema,
};

const blockWithInlineHtmlTag: NodeSpec = {
	group: ElementGroups.block,
	inline: false,
	content: `${ElementGroups.inline}*`,
	...htmlTagSchema,
};

const selfClosingHtmlTag: NodeSpec = {
	group: ElementGroups.inline,
	inline: true,
	selfClosing: true,
	...htmlTagSchema,
};

export default { inlineHtmlTag, blockHtmlTag, blockWithInlineHtmlTag, selfClosingHtmlTag };
