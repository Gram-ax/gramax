import { toggleList } from "@ext/markdown/elements/list/edit/logic/toggleList";
import SelectionBackspace from "@ext/markdown/elements/list/edit/models/listItem/logic/keys/SelectionBackspace";
import { task_list } from "@ext/markdown/elements/list/edit/models/taskList/model/taskListSchema";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";

interface TaskListOptions {
	itemTypeName: string;
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		taskList: {
			toggleTaskList: () => ReturnType;
		};
	}
}

const TaskList = Node.create<TaskListOptions>({
	...getExtensionOptions({ schema: task_list, name: "task_list", withAttributes: false }),

	addOptions() {
		return {
			itemTypeName: "task_item",
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [{ tag: 'ul[data-task-list="true"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["ul", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-task-list": "true" }), 0];
	},

	addCommands() {
		return {
			toggleTaskList:
				() =>
				({ commands, editor, dispatch }) => {
					const mainToggle = commands.toggleList(this.name, this.options.itemTypeName);
					const secondToggle = toggleList({ editor, dispatch, listName: this.name });

					return mainToggle || secondToggle;
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			"Mod-Shift-9": () => this.editor.commands.toggleTaskList(),
			...addShortcuts([SelectionBackspace()]),
		};
	},
});

export default TaskList;
