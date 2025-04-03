import {
	complexContent,
	listItem,
	simpleContent,
} from "@ext/markdown/elements/list/edit/models/listItem/model/listItemSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { findParentNodeClosestToPos } from "@tiptap/core";
import ListItem, { ListItemOptions } from "@tiptap/extension-list-item";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";

interface ListItemOptionsExtended extends ListItemOptions {
	simple: boolean;
}

const customListItem = ListItem.extend<ListItemOptionsExtended>({
	...getExtensionOptions({ schema: listItem, name: "listItem" }),

	content() {
		return this.options?.simple ? simpleContent : complexContent;
	},

	addOptions(options) {
		return { ...options, simple: options?.simple ?? true };
	},

	addProseMirrorPlugins() {
		const parentPlugins = this.parent?.() ?? [];

		return [
			...parentPlugins,
			new Plugin({
				key: new PluginKey("$NoTaskList"),
				filterTransaction: (transaction, state) => {
					const replaceSteps = transaction.steps.filter(
						(step) => step instanceof ReplaceStep || step instanceof ReplaceAroundStep,
					);
					const stepsWithTaskList = replaceSteps.filter((step) => {
						let gapFrom: number;

						if (step instanceof ReplaceAroundStep) {
							gapFrom = Math.max(Math.min(step.gapFrom, transaction.doc.content.size), 0);
						} else {
							gapFrom = Math.max(Math.min(step.from, transaction.doc.content.size), 0);
						}

						const node = transaction.doc.nodeAt(gapFrom);

						if (node?.type.name === "taskList") {
							return true;
						}

						return false;
					});

					if (!stepsWithTaskList.length) {
						return true;
					}

					const data = findParentNodeClosestToPos(
						state.selection.$from,
						(node) => node.type.name === "listItem",
					);

					if (!data?.node) {
						return true;
					}

					return false;
				},
			}),
		];
	},
});

export default customListItem;
