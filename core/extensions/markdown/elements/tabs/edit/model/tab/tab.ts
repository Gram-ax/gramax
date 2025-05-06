import EditTab from "@ext/markdown/elements/tabs/edit/components/EditTab";
import tabSchema from "@ext/markdown/elements/tabs/edit/model/tab/tabSchema";
import TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { Editor, mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		tab: { setTab: (position: number, attrs: TabAttrs) => ReturnType };
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
				(position, attrs) =>
				({ commands }) => {
					return commands.insertContentAt(position, {
						type: this.name,
						attrs,
						content: [{ type: "paragraph", content: [] }],
					});
				},
		};
	},
	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }: { editor: Editor }) => {
				const { $from, $to } = editor.view.state.selection;
				const { node: curTab } = getFocusNode(editor.state, (node) => node.type.name === this.type.name);
				const { node: parent, position } = getFocusNode(editor.state, (node) => node.type.name === "tabs");
				const curElement = $from.parent;

				if (!parent || $from.pos !== $to.pos || !curTab || curElement.type.name !== "paragraph") return false;
				if ($from.depth >= 4 || curElement.textContent) return false;

				const insertPosition = position + parent.content.size;
				return editor
					.chain()
					.deleteCurrentNode()
					.insertContentAt(insertPosition, { type: "paragraph", content: [] })
					.focus()
					.run();
			},
		};
	},
});

export default Tab;
