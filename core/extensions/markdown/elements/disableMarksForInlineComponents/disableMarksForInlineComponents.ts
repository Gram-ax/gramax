import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { AddMarkStep } from "prosemirror-transform";

const DisableMarksForInlineComponents = Extension.create({
	name: "disableMarksForInlineComponents",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("disableMarksForInlineComponents"),
				appendTransaction: (transactions, _, newState) => {
					const tr = newState.tr;
					let modified = false;

					for (const transaction of transactions) {
						transaction.steps.forEach((step) => {
							if (step instanceof AddMarkStep) {
								const { from, to } = step;

								const clampedFrom = Math.max(Math.min(from, newState.doc.content.size), 0);
								const clampedTo = Math.max(Math.min(to, newState.doc.content.size), 0);

								newState.doc.nodesBetween(clampedFrom, clampedTo, (node, pos) => {
									if (node.type.name === "icon" || node.type.name === "inlineMd_component") {
										tr.setNodeMarkup(pos, undefined, node.attrs, []);
										modified = true;
									}
								});
							}
						});
						if (modified) return tr;
					}

					return null;
				},
			}),
		];
	},
});

export default DisableMarksForInlineComponents;
