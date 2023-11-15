import paragraph from "@ext/markdown/elements/paragraph/editor/model/paragraphSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		paragraph: { setParagraph: () => ReturnType };
	}
}

const Paragraph = Node.create({
	...getExtensionOptions({ schema: paragraph, name: "paragraph" }),

	priority: 1000,

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [{ tag: "p" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["p", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			setParagraph:
				() =>
				({ commands }) => {
					return commands.setNode(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			Tab: ({ editor }) => {
				const cursor = editor.state.selection.$from;
				const targetNode = cursor.node();

				if (cursor.depth === 1 && targetNode.type.name === "paragraph") {
					return editor.chain().focus().toggleBulletList().run();
				}

				return false;
			},
			"Mod-Alt-0": () => this.editor.commands.setParagraph(),
		};
	},
});

export default Paragraph;
