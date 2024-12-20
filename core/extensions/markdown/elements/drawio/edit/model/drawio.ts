import drawio from "@ext/markdown/elements/drawio/edit/model/drawioSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditDrawio from "../components/DrawioComponent";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		drawio: {
			setDrawio: (options: { src: string; width?: string; height?: string }) => ReturnType;
		};
	}
}

const Drawio = Node.create({
	...getExtensionOptions({ schema: drawio, name: "drawio", withResource: true }),

	parseHTML() {
		return [{ tag: "drawio-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["drawio-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditDrawio);
	},

	addCommands() {
		return {
			setDrawio:
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

export default Drawio;
