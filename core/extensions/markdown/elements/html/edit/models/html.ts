import HTMLComponent from "@ext/markdown/elements/html/edit/components/HTMLComponent";
import htmlSchema from "@ext/markdown/elements/html/edit/models/htmlSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		html: {
			setHTML: (attrs: { content: string }) => ReturnType;
		};
	}
}

const html = Node.create({
	...getExtensionOptions({ schema: htmlSchema, name: "html" }),

	parseHTML() {
		return [{ tag: "html-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["html-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(HTMLComponent);
	},

	addCommands() {
		return {
			setHTML:
				(attrs) =>
				({ commands }) => {
					return commands.insertContent({ type: this.name, attrs });
				},
		};
	},
});

export default html;
