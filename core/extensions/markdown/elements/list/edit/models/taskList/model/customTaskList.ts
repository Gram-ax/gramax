import toggleListPrepare from "@ext/markdown/elements/list/edit/logic/toggleListPrepare";
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
				({ editor, chain }) => {
					toggleListPrepare(editor, chain());
					return chain().toggleList(this.name, this.options.itemTypeName).run();
				},
		};
	},
});

export default CustomTaskList;
