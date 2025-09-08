import inputRuleHandler from "@ext/markdown/elements/list/edit/logic/inputRuleHandler";
import toggleListPrepare from "@ext/markdown/elements/list/edit/logic/toggleListPrepare";
import OrderedList from "@tiptap/extension-ordered-list";

const CustomOrderList = OrderedList.extend({
	addInputRules() {
		const inputRule = this.parent()[0];
		return [inputRuleHandler(inputRule)];
	},

	addCommands() {
		return {
			toggleOrderedList:
				() =>
				({ editor, chain }) => {
					toggleListPrepare(editor, chain());
					return chain().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).run();
				},
		};
	},
});

export default CustomOrderList;
