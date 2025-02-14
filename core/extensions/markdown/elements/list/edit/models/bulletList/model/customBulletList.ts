import { wrappingInputRule } from "@tiptap/core";
import BulletList from "@tiptap/extension-bullet-list";

const TextStyleName = "textStyle";
const inputRegex = /^\s*([-*])\s$/;

const customBulletList = BulletList.extend({
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
});

export default customBulletList;