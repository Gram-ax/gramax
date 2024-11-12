import getBackspaceShortcuts from "@ext/markdown/elements/list/edit/models/listItem/logic/keys/Backspace";
import getDeleteShortcuts from "@ext/markdown/elements/list/edit/models/listItem/logic/keys/Delete";
import getEnterShortcuts from "@ext/markdown/elements/list/edit/models/listItem/logic/keys/Enter";
import getTabShortcuts from "@ext/markdown/elements/list/edit/models/listItem/logic/keys/Tab";
import TaskItemView from "@ext/markdown/elements/list/edit/models/taskItem/components/TaskItemView";
import { task_item } from "@ext/markdown/elements/list/edit/models/taskItem/model/taskItemSchema";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { Node, mergeAttributes, wrappingInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

const inputRegex = /^\s*(\[([( |x])?\])\s$/;

const TaskItem = Node.create({
	...getExtensionOptions({ schema: task_item, name: "task_item", withAttributes: false }),

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	renderHTML({ node, HTMLAttributes }) {
		return [
			"li",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				"data-type": this.name,
			}),
			[
				"label",
				[
					"input",
					{
						type: "checkbox",
						checked: node.attrs.checked ? "checked" : null,
					},
				],
			],
			["div", 0],
		];
	},

	addAttributes() {
		return {
			checked: {
				default: false,
				keepOnSplit: false,
				parseHTML: (element) => element.getAttribute("data-checked") === "true",
				renderHTML: (attributes) => ({
					"data-checked": attributes.checked,
				}),
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: `li[data-type="${this.name}"]`,
				priority: 51,
			},
		];
	},

	addKeyboardShortcuts() {
		return {
			"Shift-Tab": () => this.editor.commands.liftListItem(this.name),
			...addShortcuts(
				[getBackspaceShortcuts(), getDeleteShortcuts(), getEnterShortcuts(), getTabShortcuts()],
				this.name,
			),
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(TaskItemView);
	},

	addInputRules() {
		return [
			wrappingInputRule({
				find: inputRegex,
				type: this.type,
				getAttributes: (match) => ({
					checked: match[match.length - 1] === "x",
				}),
			}),
		];
	},
});

export default TaskItem;
