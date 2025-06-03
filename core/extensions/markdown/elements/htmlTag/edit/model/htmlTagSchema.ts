import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import { NodeSpec } from "@tiptap/pm/model";

export const inlineHtmlTagComponent: NodeSpec = {
	group: ElementGroups.inline,
	inline: true,
	attrs: { content: {} },
};

export const blockHtmlTagComponent: NodeSpec = {
	group: ElementGroups.block,
	inline: false,
	attrs: { content: {} },
};
