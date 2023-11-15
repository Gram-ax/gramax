import { Extension } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";

const OnDeleteNode = Extension.create({
	name: "onDeleteNode",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				appendTransaction: (transactions, oldState) => {
					transactions.forEach((transaction) => {
						transaction.steps.forEach((step) => {
							if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
								const slice = step.slice;
								if (slice.size === 0 && step.from < step.to) {
									const removedNodes: Node[] = [];
									oldState.doc.nodesBetween(step.from, step.to, (node) => {
										removedNodes.push(node);
									});
									if (removedNodes.length && this.options.onDeleteNodes) {
										if (this.options.onDeleteNodes) this.options.onDeleteNodes(removedNodes);
									}
								}
							}
						});
					});

					return null;
				},
			}),
		];
	},
});

export default OnDeleteNode;
