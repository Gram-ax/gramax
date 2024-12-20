import { Extension } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { Plugin, PluginKey, Transaction } from "prosemirror-state";

export const listTypes = ["orderedList", "bulletList", "taskList"];

function mergeAdjacentLists(tr: Transaction, node: Node, parentOffset = 0): Transaction {
	let state = true;

	node.forEach((child, childOffset) => {
		if (listTypes.includes(child.type.name)) {
			if (!state) return state;
			const nextNode = node.childAfter(childOffset + child.nodeSize);
			if (nextNode.node && child.type === nextNode.node.type) {
				tr = tr.join(childOffset + parentOffset + child.nodeSize);
				state = false;
			}
		}
	});

	return tr;
}

export const joinLists = Extension.create({
	name: "joinLists",

	addOptions() {
		return {};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey(this.name),

				appendTransaction: (_, __, newState) => {
					const cursor = newState.selection.$from;

					if (cursor.depth < 3) return null;

					const list = cursor.node(-2);
					if (!listTypes.includes(list.type.name)) return null;

					const grandparent = cursor.node(-3);

					if (grandparent.type.name === "doc") {
						return mergeAdjacentLists(newState.tr, grandparent);
					}

					if (grandparent.type.name) {
						const grandparentPos = cursor.before(-3);
						return mergeAdjacentLists(newState.tr, grandparent, grandparentPos + 1);
					}
				},
			}),
		];
	},
});
