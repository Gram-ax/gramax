import getIsSelectedOneNode from "@ext/markdown/elementsUtils/getIsSelectedOneNode";
import { Mark, markInputRule, markPasteRule, mergeAttributes } from "@tiptap/core";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import space from "@ext/markdown/logic/keys/marks/space";
import arrowRight from "@ext/markdown/logic/keys/marks/arrowRight";

interface CodeOptions {
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		code: {
			setCode: () => ReturnType;
			toggleCode: () => ReturnType;
			unsetCode: () => ReturnType;
		};
	}
}

const inputRegex = /(?:^|\s)((?:`)((?:[^`]+))(?:`))$/;
const pasteRegex = /(?:^|\s)((?:`)((?:[^`]+))(?:`))/g;

const Code = Mark.create<CodeOptions>({
	name: "code",
	code: true,
	priority: 1001,
	excludes: "strong em comment highlight",

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	inclusive() {
		return false;
	},

	parseHTML() {
		return [{ tag: "code" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["code", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			setCode:
				() =>
				({ commands }) => {
					return commands.setMark(this.name);
				},
			toggleCode:
				() =>
				({ commands, editor }) => {
					if (editor.isActive(this.name)) return commands.toggleMark(this.name);
					if (getIsSelectedOneNode(editor.state)) return commands.toggleMark(this.name);
				},
			unsetCode:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[
				{ key: "Space", focusShouldBeInsideNode: false, rules: [space("toggleCode", this.type.name)] },
				{ key: "ArrowRight", focusShouldBeInsideNode: false, rules: [arrowRight("toggleCode")] },
				{ key: "Mod-l", focusShouldBeInsideNode: false, rules: [({ editor }) => editor.commands.toggleCode()] },
				{ key: "Mod-L", focusShouldBeInsideNode: false, rules: [({ editor }) => editor.commands.toggleCode()] },
			],
			this.type.name,
		);
	},

	addInputRules() {
		return [
			markInputRule({
				find: inputRegex,
				type: this.type,
			}),
		];
	},

	addPasteRules() {
		return [
			markPasteRule({
				find: pasteRegex,
				type: this.type,
			}),
		];
	},
});

export default Code;
