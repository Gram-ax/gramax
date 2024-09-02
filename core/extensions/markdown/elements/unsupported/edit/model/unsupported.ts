import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditUnsupported from "../components/Unsupported";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import unsupported from "@ext/markdown/elements/unsupported/edit/model/unsupportedSchema";

const Cue = Node.create({
	...getExtensionOptions({ schema: unsupported, name: "unsupported" }),
	content: undefined,

	parseHTML() {
		return [{ tag: "unsupported-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["unsupported-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditUnsupported);
	},
});

export default Cue;
