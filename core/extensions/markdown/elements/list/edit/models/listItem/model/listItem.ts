import inputRuleHandler from "@ext/markdown/elements/list/edit/logic/inputRuleHandler";
import { listItem } from "@ext/markdown/elements/list/edit/models/listItem/model/listItemSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { wrappingInputRule } from "@tiptap/core";
import ListItem, { ListItemOptions } from "@tiptap/extension-list-item";
import { TaskItem } from "@tiptap/extension-task-item";
import taskListPlugin from "@ext/markdown/elements/list/edit/models/listItem/logic/taskListPlugin";

export const CHECKED_ATTR = "checked";

const taskItemInputRegex = /^\s*(\[([( |x])?\])\s$/;

const CustomListItem = ListItem.extend<ListItemOptions>({
	...getExtensionOptions({ schema: listItem, name: "listItem" }),

	addOptions(options) {
		return { ...options, simple: options?.simple ?? true, HTMLAttributes: {} };
	},

	addNodeView() {
		return (props) => {
			if (props.node.attrs.isTaskItem) return TaskItem.config.addNodeView.call(this)(props);
		};
	},

	addInputRules() {
		return [
			inputRuleHandler(
				wrappingInputRule({
					find: taskItemInputRegex,
					type: this.type,
					getAttributes: (match) => ({
						checked: match[match.length - 1] === "x",
						isTaskItem: true,
					}),
					joinPredicate: (match, node) => node.type === this.type,
				}),
			),
		];
	},

	addProseMirrorPlugins() {
		const parentPlugins = this.parent?.() ?? [];
		const type = this.type.name;
		const schema = this.editor.schema;

		return [...parentPlugins, taskListPlugin(type, schema)];
	},

	addKeyboardShortcuts() {
		return {
			...this.parent(),
			Enter: ({ editor }) => {
				if (editor.isActive("code_block")) return;
				return this.parent().Enter({ editor });
			},
		};
	},
});

export default CustomListItem;
