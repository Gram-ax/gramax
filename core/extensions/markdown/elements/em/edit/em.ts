import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import arrowRight from "@ext/markdown/logic/keys/marks/arrowRight";
import space from "@ext/markdown/logic/keys/marks/space";
import { Mark, markInputRule, markPasteRule, mergeAttributes } from "@tiptap/core";

interface ItalicOptions {
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		italic: { setItalic: () => ReturnType; toggleItalic: () => ReturnType; unsetItalic: () => ReturnType };
	}
}

const starInputRegex = /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))$/;
export const starPasteRegex = /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))/g;
const underscoreInputRegex = /(?:^|\s)((?:_)((?:[^_]+))(?:_))$/;
export const underscorePasteRegex = /(?:^|\s)((?:_)((?:[^_]+))(?:_))/g;

const Em = Mark.create<ItalicOptions>({
	name: "em",

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [
			{
				tag: "em",
			},
			{
				tag: "i",
				getAttrs: (node) => node.style.fontStyle !== "normal" && null,
			},
			{
				style: "font-style=italic",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["em", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			setItalic:
				() =>
				({ commands }) => {
					return commands.setMark(this.name);
				},
			toggleItalic:
				() =>
				({ commands }) => {
					return commands.toggleMark(this.name);
				},
			unsetItalic:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[
				{ key: "Space", focusShouldBeInsideNode: false, rules: [space("toggleItalic", this.type.name)] },
				{ key: "ArrowRight", focusShouldBeInsideNode: false, rules: [arrowRight("toggleItalic")] },
				{
					key: "Mod-i",
					focusShouldBeInsideNode: false,
					rules: [({ editor }) => editor.commands.toggleItalic()],
				},
				{
					key: "Mod-I",
					focusShouldBeInsideNode: false,
					rules: [({ editor }) => editor.commands.toggleItalic()],
				},
			],
			this.type.name,
		);
	},

	addInputRules() {
		return [
			markInputRule({
				find: starInputRegex,
				type: this.type,
			}),
			markInputRule({
				find: underscoreInputRegex,
				type: this.type,
			}),
		];
	},

	addPasteRules() {
		return [
			markPasteRule({
				find: starPasteRegex,
				type: this.type,
			}),
			markPasteRule({
				find: underscorePasteRegex,
				type: this.type,
			}),
		];
	},
});

export default Em;
