import { blockMd_component } from "@ext/markdown/elements/md/model/blockMdSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditBlock from "../component/EditBlock";

const BlockMdComponent = Node.create({
	...getExtensionOptions({ schema: blockMd_component, name: "blockMd_component" }),

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

export default BlockMdComponent;
