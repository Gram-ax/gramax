import shortcutRulePrepare from "@ext/markdown/elements/list/edit/logic/shortcutRulePrepare";
import { wrappingInputRule } from "@tiptap/core";
import BulletList from "@tiptap/extension-bullet-list";

const TextStyleName = "textStyle";
const inputRegex = /^\s*([-*])\s$/;

const CustomBulletList = BulletList.extend({
	addInputRules() {
		let inputRule = wrappingInputRule({
			find: inputRegex,
			type: this.type,
		});

		if (this.options.keepMarks || this.options.keepAttributes) {
			inputRule = wrappingInputRule({
				find: inputRegex,
				type: this.type,
				keepMarks: this.options.keepMarks,
				keepAttributes: this.options.keepAttributes,
				getAttributes: () => {
					return this.editor.getAttributes(TextStyleName);
				},
				editor: this.editor,
			});
		}
		return [inputRule];
	},

	addCommands() {
		return {
			toggleBulletList:
				() =>
				({ editor }) => {
					const chain = shortcutRulePrepare(editor);
					return chain.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).run();
				},
		};
	},
});

export default CustomBulletList;
