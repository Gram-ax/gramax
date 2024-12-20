import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditDiagrams from "../components/DiagramsComponent";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import diagrams from "@ext/markdown/elements/diagrams/edit/models/diagramsSchema";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		diagrams: {
			setDiagrams: (options: { src: string; diagramName: string; width?: string; height?: string }) => ReturnType;
		};
	}
}

const Diagrams = Node.create({
	...getExtensionOptions({ schema: diagrams, name: "diagrams", withResource: true }),

	parseHTML() {
		return [{ tag: "diagrams-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["diagrams-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditDiagrams);
	},

	addCommands() {
		return {
			setDiagrams:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: options,
					});
				},
		};
	},
});

export default Diagrams;
