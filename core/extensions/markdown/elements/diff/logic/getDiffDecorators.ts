import { DiffItemType, DiffNode } from "@ext/markdown/elements/diff/edit/model/DiffItemTypes";
import getNodeByPos from "@ext/markdown/elementsUtils/getNodeByPos";
import { recreateTransform } from "@manuscripts/prosemirror-recreate-steps";
import { AddMarkStep, RemoveMarkStep, ReplaceAroundStep, ReplaceStep, Step, Transform } from "@tiptap/pm/transform";
import { Node } from "prosemirror-model";

function getRemovedUselessMarkSteps(transform: Transform): Step[] {
	const steps: Step[] = [];
	const idxToRemove: number[] = [];
	const addedMarkSteps: { step: AddMarkStep; idx: number }[] = [];
	const removedMarkSteps: { step: RemoveMarkStep; idx: number }[] = [];
	transform.steps.forEach((step, idx) => {
		if (step instanceof AddMarkStep) {
			addedMarkSteps.push({ step, idx });
		} else if (step instanceof RemoveMarkStep) {
			removedMarkSteps.push({ step, idx });
		}
	});
	addedMarkSteps.forEach(({ step, idx }) => {
		const uselessPair = removedMarkSteps.find(
			({ step: removedStep }) =>
				removedStep.from === step.from &&
				removedStep.to === step.to &&
				removedStep.mark.type.name === step.mark.type.name,
		);
		if (uselessPair) idxToRemove.push(uselessPair.idx, idx);
	});
	transform.steps.forEach((step, idx) => {
		if (idxToRemove.includes(idx)) return;
		steps.push(step);
	});
	return steps;
}

function getRelativePositions(
	nodesBetween: { node: Node; position: number; idx: number }[],
	from: number,
	to: number,
	paths: string[],
	diffType: DiffItemType,
): DiffNode[] {
	const res: DiffNode[] = [];
	nodesBetween.forEach(({ node, position, idx }) => {
		const delta = to - from;
		const nodeStart = position;
		const nodeEnd = nodeStart + node.nodeSize;
		if (from <= nodeStart && nodeEnd <= to) {
			res.push({ path: paths[idx], block: true, diffType });
		} else {
			const relativeNodeStart = 0;
			const relativeNodeEnd = node.nodeSize;
			let relativeFrom = from - position - 1; // -1 because paragraph and text offset
			let relativeTo = relativeFrom + delta;
			if (relativeFrom <= relativeNodeStart) {
				relativeFrom = relativeNodeStart;
			}
			if (relativeTo >= relativeNodeEnd) {
				relativeTo = relativeNodeEnd;
			}

			res.push({ path: paths[idx], block: false, diffType, relativeFrom, relativeTo });
		}
	});
	return res;
}

function getDiffNodesByPos(doc: Node, from: number, to: number, diffType: DiffItemType, paths: string[]): DiffNode[] {
	if (from === to) return [];
	console.log(`🚀 ~ from:`, from);
	console.log(`🚀 ~ to:`, to);
	console.log(`🚀 ~ diffType:`, diffType);

	const nodesBetween: { node: Node; position: number; idx: number }[] = [];
	doc.nodesBetween(from, to, (node, pos, _, idx) => {
		nodesBetween.push({ node, position: pos, idx });
		if (node.type.name === "diff_item") return false;
	});
	console.log(`🚀 ~ nodesBetween:`, nodesBetween);
	const relativeNodes = getRelativePositions(nodesBetween, from, to, paths, diffType);
	console.log(`🚀 ~ relativeNodes:`, relativeNodes);
	return relativeNodes;
}

function getDiffNodes(oldDoc: Node, oldPaths: string[], newDoc: Node, newPaths: string[]): DiffNode[] {
	console.log(`🚀 ~ oldDoc:`, oldDoc);
	console.log(`🚀 ~ newDoc:`, newDoc);
	const transform = recreateTransform(oldDoc, newDoc, true, true);
	if (!transform.docChanged) return [];
	console.log(`🚀 ~ transform:`, transform);

	const steps = getRemovedUselessMarkSteps(transform);
	console.log(`🚀 ~ steps:`, steps);

	const diffNodes: DiffNode[] = [];

	steps.forEach((step, idx) => {
		if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
			let originalFrom = step.from;
			let originalTo = step.to;
			for (let i = idx - 1; i >= 0; i--) {
				originalFrom = transform.steps[i].getMap().invert().map(originalFrom);
				originalTo = transform.steps[i].getMap().invert().map(originalTo);
			}
			if (step instanceof ReplaceStep) {
				const addedFrom = step.from;
				const addedTo = step.from + step.slice.size;
				diffNodes.push(...getDiffNodesByPos(newDoc, addedFrom, addedTo, "added", newPaths));
				diffNodes.push(...getDiffNodesByPos(oldDoc, originalFrom, originalTo, "deleted", oldPaths));
			} else {
				// changed attrs
				if (step.slice.content.childCount === 1 && step.slice.content.child(0).childCount === 0) {
					const nodeFromPosition = getNodeByPos(
						step.from,
						newDoc,
						(node) => node.type.name === step.slice.content.child(0).type.name,
					);
					diffNodes.push(
						...getDiffNodesByPos(
							newDoc,
							nodeFromPosition.position,
							nodeFromPosition.position + nodeFromPosition.node.nodeSize,
							"changedContext",
							newPaths,
						),
					);
				} else {
					diffNodes.push(...getDiffNodesByPos(newDoc, step.from, step.to, "added", newPaths));
					diffNodes.push(...getDiffNodesByPos(oldDoc, originalFrom, originalTo, "deleted", oldPaths));
				}
			}
		} else if (step instanceof AddMarkStep) {
			diffNodes.push(...getDiffNodesByPos(newDoc, step.from, step.to, "changedContext", newPaths));
		}
	});
	console.log(`🚀 ~ diffNodes:`, diffNodes);
	return diffNodes;
}

export default getDiffNodes;
