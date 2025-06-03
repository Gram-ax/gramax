import { inlineHtmlTagComponent, blockHtmlTagComponent } from "./htmlTagSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import InlineHtmlTagComponent from "../component/InlineHtmlTagComponent";
import BlockHtmlTagComponent from "../component/BlockHtmlTagComponent";

export const InlineHtmlTag = Node.create({
	...getExtensionOptions({ schema: inlineHtmlTagComponent, name: "inlineHtmlTagComponent" }),

	parseHTML() {
		return [{ tag: "inline-Html-Tag-Component-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["inline-Html-Tag-Component-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(InlineHtmlTagComponent);
	},
});

export const BlockHtmlTag = Node.create({
	...getExtensionOptions({ schema: blockHtmlTagComponent, name: "blockHtmlTagComponent" }),

	parseHTML() {
		return [{ tag: "block-Html-Tag-Component-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["block-Html-Tag-Component-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(BlockHtmlTagComponent);
	},
});
