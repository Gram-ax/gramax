import fragmentSchema from "@ext/markdown/elements/fragment/edit/model/fragmentSchema";
import type { FragmentRenderData } from "@ext/markdown/elements/fragment/edit/model/types";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import FragmentComponent from "../components/FragmentComponent";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		fragment: {
			setFragment: (attrs: FragmentRenderData) => ReturnType;
		};
	}
}

const Fragment = Node.create({
	...getExtensionOptions({ schema: fragmentSchema, name: "fragment" }),

	parseHTML() {
		return [{ tag: "fragment-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["fragment-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(FragmentComponent);
	},

	addCommands() {
		return {
			setFragment:
				(attrs) =>
				({ commands }) => {
					return commands.insertContent({ type: this.name, attrs });
				},
		};
	},
});

export default Fragment;
