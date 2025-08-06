import shortcutRulePrepare from "@ext/markdown/elements/list/edit/logic/shortcutRulePrepare";
import TaskList from "@tiptap/extension-task-list";

const CustomTaskList = TaskList.extend({
	addOptions() {
		return {
			itemTypeName: "listItem",
			HTMLAttributes: {},
		};
	},

	addCommands() {
		return {
			toggleTaskList:
				() =>
				({ editor }) => {
					const chain = shortcutRulePrepare(editor);
					return chain.toggleList(this.name, this.options.itemTypeName).run();
				},
		};
	},
});

export default CustomTaskList;
