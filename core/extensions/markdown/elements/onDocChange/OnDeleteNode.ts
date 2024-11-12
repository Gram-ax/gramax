import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";

const OnDeleteNode = Extension.create({
	name: "onDeleteNode",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				appendTransaction: (transactions, oldState) => {
					transactions.forEach((transaction) => {
						if (transaction.doc.content.size !== oldState.doc.content.size && transaction.docChanged) {
							transaction.steps.forEach((step) => {
								if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
									const { from, to } = step;
									let gapTo: number, gapFrom: number;

									if (step instanceof ReplaceAroundStep) {
										gapTo = step.gapTo;
										gapFrom = step.gapFrom;
									} else {
										gapTo = step.to;
										gapFrom = step.from;
									}

									const sliceSizeChange = step.slice.size - (to - from);

									if (sliceSizeChange !== 0) {
										const removedNodes = [];
										const addedNodes = [];

										if (oldState && oldState.doc && oldState.doc.content) {
											const docSize = oldState.doc.content.size;
											const oldFrom = Math.max(Math.min(from, docSize), 0);
											const oldTo = Math.max(Math.min(to, docSize), 0);

											oldState.doc.content.nodesBetween(oldFrom, oldTo, (node) => {
												removedNodes.push(node);
											});
										}

										if (transaction.doc && transaction.doc.content) {
											const docSize = transaction.doc.content.size;
											const oldFrom = Math.max(Math.min(gapFrom ?? from, docSize), 0);
											const oldTo = Math.max(Math.min(gapTo ?? to, docSize), 0);

											transaction.doc.content.nodesBetween(oldFrom, oldTo, (node) => {
												addedNodes.push(node);
											});
										}

										if (removedNodes.length && this.options.onDeleteNodes) {
											const nodeNeedRemove = removedNodes.filter(
												(node) => !addedNodes.includes(node),
											);
											this.options.onDeleteNodes(nodeNeedRemove);
										}
									}
								}
							});
						}
					});

					return null;
				},
			}),
		];
	},
});

export default OnDeleteNode;
