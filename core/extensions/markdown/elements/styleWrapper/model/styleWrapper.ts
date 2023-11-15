import style_wrapper from "@ext/markdown/elements/styleWrapper/model/styleWrapperSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Node as ProseMirrorNode } from "prosemirror-model";
import { CSSProperties } from "react";
import StyleWrapperComponent from "../component/StyleWrapper";
import wrapNode from "@ext/markdown/elementsUtils/wrapNode";
import liftNode from "@ext/markdown/elementsUtils/liftNode";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		styleWrapper: {
			styleWrap: (style: CSSProperties, node: ProseMirrorNode, pos: number) => ReturnType;
			styleUnwrap: (styleNode: ProseMirrorNode, styleNodePos: number) => ReturnType;
		};
	}
}

const StyleWrapper = Node.create({
	...getExtensionOptions({ schema: style_wrapper, name: "style_wrapper" }),

	parseHTML() {
		return [{ tag: "style-wrapper-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["style-wrapper-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(StyleWrapperComponent);
	},

	addCommands() {
		return {
			styleWrap:
				(style, node, pos) =>
				({ tr, state }) => {
					wrapNode(state, tr, node, pos, this.type, { style });

					return true;
				},
			styleUnwrap:
				(styleNode, styleNodePos) =>
				({ tr, state }) => {
					liftNode(state, tr, styleNode.firstChild, styleNodePos + 1);

					return true;
				},
		};
	},
});

export default StyleWrapper;
