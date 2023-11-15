import inlineMd_component from "@ext/markdown/elements/md/model/inlineMdSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditInline from "../component/EditInline";

const InlineMdComponent = Node.create({
	...getExtensionOptions({ schema: inlineMd_component, name: "inlineMd_component" }),

	parseHTML() {
		return [{ tag: "inline-md-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["inline-md-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditInline);
	},
});

export default InlineMdComponent;
