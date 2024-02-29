import { bullet_list } from "@ext/markdown/elements/list/edit/models/bulletList/model/bulletListSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node, wrappingInputRule } from "@tiptap/core";

interface BulletListOptions {
	itemTypeName: string;
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		bulletList: {
			toggleBulletList: () => ReturnType;
		};
	}
}

const inputRegex = /^\s*([-+*])\s$/;

const BulletList = Node.create<BulletListOptions>({
	...getExtensionOptions({ schema: bullet_list, name: "bullet_list", withAttributes: false }),

	addOptions() {
		return {
			itemTypeName: "list_item",
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [{ tag: "ul" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["ul", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			toggleBulletList:
				() =>
				({ commands }) => {
					return commands.toggleList(this.name, this.options.itemTypeName);
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			"Mod-Shift-8": () => this.editor.commands.toggleBulletList(),
		};
	},

	addInputRules() {
		return [
			wrappingInputRule({
				find: inputRegex,
				type: this.type,
			}),
		];
	},
});

export default BulletList;
