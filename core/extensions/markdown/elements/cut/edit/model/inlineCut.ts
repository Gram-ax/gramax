import inlineCut_component from "@ext/markdown/elements/cut/edit/model/inlineCutSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditInlineCut from "../components/Cut";

const InlineCutComponent = Node.create({
	...getExtensionOptions({ schema: inlineCut_component, name: "inlineCut_component" }),

	parseHTML() {
		return [{ tag: "inline-cut-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["inline-cut-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditInlineCut);
	},
});

export default InlineCutComponent;
