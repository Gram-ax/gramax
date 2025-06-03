import blockMd from "@ext/markdown/elements/md/model/blockMdSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditBlock from "../component/EditBlock";

const BlockMd = Node.create({
	...getExtensionOptions({ schema: blockMd, name: "blockMd" }),

	parseHTML() {
		return [{ tag: "block-md-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["block-md-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditBlock);
	},
});

export default BlockMd;
