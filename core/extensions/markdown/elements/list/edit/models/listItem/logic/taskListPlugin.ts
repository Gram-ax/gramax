import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Node, Schema } from "@tiptap/pm/model";

const taskListPlugin = (type: string, schema: Schema) =>
	new Plugin({
		key: new PluginKey("$TaskList"),
		appendTransaction(transactions, oldState, newState) {
			let tr = newState.tr;
			let modified = false;

			const inputRuleProcces = (parent: Node, parentStart: number, taskItem: Node) => {
				const newTaskList = schema.nodes.taskList.create(null, [taskItem]);
				tr.replaceWith(parentStart, parentStart + parent.nodeSize, newTaskList);
				modified = true;
			};

			const transformListItems = (parent: Node, parentStart: number) => {
				parent.forEach((node, offset) => {
					const pos = parentStart + offset;
					if (node.type.name === "listItem") {
						if (parent.type.name === "taskList" && !node.attrs.isTaskItem) {
							tr = tr.setNodeMarkup(pos, undefined, {
								...node.attrs,
								isTaskItem: true,
								checked: false,
							});
							modified = true;
						}
						if (parent.type.name !== "taskList" && node.attrs.isTaskItem) {
							const attrs = { ...node.attrs };
							delete attrs.checked;
							delete attrs.isTaskItem;
							tr = tr.setNodeMarkup(pos, undefined, attrs);
							modified = true;
						}
					}
				});
			};

			transactions.forEach((transaction) => {
				transaction.steps.forEach((step) => {
					const map = step.getMap();

					map.forEach((oldStart, _, newStart) => {
						const clampedOldStart = Math.max(Math.min(oldStart, oldState.doc.content.size), 0);
						const clampedNewStart = Math.max(Math.min(newStart, transaction.doc.content.size), 0);
						const oldParent = oldState.doc.nodeAt(clampedOldStart);
						const newParent = transaction.doc.nodeAt(clampedNewStart);

						if (!newParent) return;
						if (newParent?.type.name === type) {
							const resolved = transaction.doc.resolve(clampedNewStart);
							const parent = resolved.parent;

							if (oldParent?.type.name !== "text")
								return transformListItems(parent, resolved.before(resolved.depth) + 1);

							if (newParent.attrs.isTaskItem) inputRuleProcces(parent, clampedNewStart - 1, newParent);
						}
						if (
							(oldParent?.type.name === "taskList" || newParent.type.name === "taskList") &&
							oldParent?.type.name !== newParent.type.name
						)
							transformListItems(newParent, clampedNewStart + 1);
					});
				});
			});

			return modified ? tr : null;
		},
	});

export default taskListPlugin;
