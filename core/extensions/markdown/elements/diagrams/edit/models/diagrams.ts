import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditDiagrams from "../components/DiagramsComponent";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		diagrams: {
			setDiagrams: (options: { src?: string; content?: string; diagramName: string }) => ReturnType;
		};
	}
}

const Diagrams = Node.create({
	name: "diagrams",
	group: "block",

	addAttributes() {
		return {
			src: { default: null },
			title: { default: null },
			content: { default: null },
			diagramName: { default: null },
			isUpdating: { default: false },
		};
	},

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
