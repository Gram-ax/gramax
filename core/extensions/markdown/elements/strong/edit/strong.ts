import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import arrowRight from "@ext/markdown/logic/keys/marks/arrowRight";
import space from "@ext/markdown/logic/keys/marks/space";
import { Mark, markInputRule, markPasteRule, mergeAttributes } from "@tiptap/core";

interface StrongOptions {
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		strong: { setStrong: () => ReturnType; toggleStrong: () => ReturnType; unsetStrong: () => ReturnType };
	}
}

const starInputRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/;
export const starPasteRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g;
const underscoreInputRegex = /(?:^|\s)((?:__)((?:[^__]+))(?:__))$/;
export const underscorePasteRegex = /(?:^|\s)((?:__)((?:[^__]+))(?:__))/g;

const Strong = Mark.create<StrongOptions>({
	name: "strong",

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [
			{
				tag: "strong",
			},
			{
				tag: "b",
				getAttrs: (node) => node.style.fontWeight !== "normal" && null,
			},
			{
				style: "font-weight",
				getAttrs: (value) => /^(strong(er)?|[5-9]\d{2,})$/.test(value as string) && null,
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["strong", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			setStrong:
				() =>
				({ commands }) => {
					return commands.setMark(this.name);
				},
			toggleStrong:
				() =>
				({ commands }) => {
					return commands.toggleMark(this.name);
				},
			unsetStrong:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[
				{ key: "Space", focusShouldBeInsideNode: false, rules: [space("toggleStrong", this.type.name)] },
				{ key: "ArrowRight", focusShouldBeInsideNode: false, rules: [arrowRight("toggleStrong")] },
				{
					key: "Mod-b",
					focusShouldBeInsideNode: false,
					rules: [({ editor }) => editor.commands.toggleStrong()],
				},
				{
					key: "Mod-B",
					focusShouldBeInsideNode: false,
					rules: [({ editor }) => editor.commands.toggleStrong()],
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

export default Strong;
