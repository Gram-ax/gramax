import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";

const OnDeleteNode = Extension.create({
	name: "onDeleteNode",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				appendTransaction: (transactions, oldState) => {
					const changes = [];

					transactions.forEach((transaction) => {
						let changedContent = false;

						if (transaction.doc.content.size !== oldState.doc.content.size) {
							changedContent = true;
						}

						if (changedContent) {
							transaction.steps.forEach((step) => {
								if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
									const { from, to } = step;
									const sliceSizeChange = step.slice.size - (to - from);

									if (sliceSizeChange !== 0) {
										const removedNodes = [];
										oldState.doc.nodesBetween(from, to, (node) => {
											removedNodes.push(node);
										});

										if (removedNodes.length && this.options.onDeleteNodes) {
											this.options.onDeleteNodes(removedNodes);
										}
									}
								}
							});
						}
					});

					if (changes.length === 0) {
						return null;
					} else {
						return changes.reduce((acc, val) => acc.concat(val), []);
					}
				},
			}),
		];
	},
});

export default OnDeleteNode;
