import EditTab from "@ext/markdown/elements/tabs/edit/components/EditTab";
import tabSchema from "@ext/markdown/elements/tabs/edit/model/tab/tabSchema";
import TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { Editor, mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { splitBlock } from "prosemirror-commands";
import noneBackspace from "../../logic/noneBackspace";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		tab: { setTab: (attrs: TabAttrs) => ReturnType };
	}
}

const Tab = Node.create({
	...getExtensionOptions({ schema: tabSchema, name: "tab" }),

	parseHTML() {
		return [{ tag: "tab-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["tab-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditTab);
	},

	addCommands() {
		return {
			setTab:
				(attrs) =>
				({ commands }) => {
					return commands.insertContent({
						attrs,
						type: this.name,
						content: [{ type: "paragraph", content: [] }],
					});
				},
		};
	},
	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }: { editor: Editor }) => {
				const { $from, $to } = editor.view.state.selection;
				const { node } = getFocusNode(editor.state, (node) => node.type.name === this.type.name);
				if (node?.type?.name === this.type.name && $from.pos === $to.pos) {
					return splitBlock(editor.view.state, editor.view.dispatch);
				}
				return false;
			},

			Backspace: noneBackspace(this.type.name),
			"Mod-Backspace": noneBackspace(this.type.name),
			"Shift-Backspace": noneBackspace(this.type.name),
		};
	},
});

export default Tab;
