import snippetSchema from "@ext/markdown/elements/snippet/edit/model/snippetSchema";
import { SnippetRenderData } from "@ext/markdown/elements/snippet/edit/model/types";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import SnippetComponent from "../components/SnippetComponent";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		snippet: {
			setSnippet: (attrs: SnippetRenderData) => ReturnType;
		};
	}
}

const Snippet = Node.create({
	...getExtensionOptions({ schema: snippetSchema, name: "snippet" }),

	parseHTML() {
		return [{ tag: "snippet-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["snippet-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(SnippetComponent);
	},

	addCommands() {
		return {
			setSnippet:
				(attrs) =>
				({ commands }) => {
					return commands.insertContent({ type: this.name, attrs });
				},
		};
	},
});

export default Snippet;
