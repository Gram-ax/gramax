import cut from "@ext/markdown/elements/cut/edit/model/cutSchema";
import { stopExecution } from "@ext/markdown/elementsUtils/cursorFunctions";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditCut from "../components/Cut";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		ourCut: { toggleCut: () => ReturnType };
	}
}

const Cut = Node.create({
	...getExtensionOptions({ schema: cut, name: "cut" }),

	parseHTML() {
		return [{ tag: "cut-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["cut-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditCut);
	},

	addCommands() {
		return {
			toggleCut:
				() =>
				({ editor, commands }) => {
					if (stopExecution(editor, this.name)) return false;

					const isActive = editor?.isActive("cut") || editor?.isActive("inlineCut_component");
					if (isActive) return commands.toggleWrap(this.name);
					return commands.toggleWrap(this.name, { text: "Подробнее", expanded: true, isInline: false });
				},
		};
	},
});

export default Cut;
