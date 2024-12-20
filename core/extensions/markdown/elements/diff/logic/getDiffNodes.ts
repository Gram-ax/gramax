import {
	AddedDiffNode,
	DeletedDiffNode,
	DiffItemType,
	DiffNode,
} from "@ext/markdown/elements/diff/edit/model/DiffItemTypes";
import getNodeByPos from "@ext/markdown/elementsUtils/getNodeByPos";
import { AddMarkStep, RemoveMarkStep, ReplaceAroundStep, ReplaceStep, Step, Transform } from "@tiptap/pm/transform";
import { Node } from "prosemirror-model";
import { recreateTransform } from "./recreateTransform";

let logs: any = {};

function getRemovedUselessMarkSteps(transform: Transform, stepsFilter?: (step: Step) => boolean): Step[] {
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

	const filteredSteps = stepsFilter ? transform.steps.filter(stepsFilter) : transform.steps;

	filteredSteps.forEach((step, idx) => {
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

function getDiffNodesByPos(
	doc: Node,
	from: number,
	to: number,
	diffType: DiffItemType,
	paths: string[],
	logs: any,
): DiffNode[] {
	if (from === to) return [];
	logs.from = from;
	logs.to = to;

	const nodesBetween: { node: Node; position: number; idx: number }[] = [];
	doc.nodesBetween(from, to, (node, pos, _, idx) => {
		nodesBetween.push({ node, position: pos, idx });
		if (node.type.name === "diff_item") return false;
	});
	logs.nodesBetween = nodesBetween;
	const relativeNodes = getRelativePositions(nodesBetween, from, to, paths, diffType);
	logs.relativeNodes = relativeNodes;
	return relativeNodes;
}

function getDiffNodes(
	oldDoc: Node,
	oldPaths: string[],
	newDoc: Node,
	newPaths: string[],
	stepsFilter?: (step: Step) => boolean,
	shouldLog = true,
): DiffNode[] {
	logs = {};
	logs.oldDoc = oldDoc;
	logs.newDoc = newDoc;
	const transform = recreateTransform(oldDoc, newDoc, true, true);
	if (!transform.docChanged) return [];
	logs.transform = transform;

	const steps = getRemovedUselessMarkSteps(transform, stepsFilter);
	logs.steps = steps;
	logs.stepsLogs = { added: [], deleted: [], changedContext: [] };

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
				const lastLogsAdded = logs.stepsLogs.added.push({}) - 1;
				const addedDiffNodes = getDiffNodesByPos(
					newDoc,
					addedFrom,
					addedTo,
					"added",
					newPaths,
					logs.stepsLogs.added[lastLogsAdded],
				);

				const lastDeleted = logs.stepsLogs.deleted.push({}) - 1;
				const deletedDiffNodes = getDiffNodesByPos(
					oldDoc,
					originalFrom,
					originalTo,
					"deleted",
					oldPaths,
					logs.stepsLogs.deleted[lastDeleted],
				);

				addedDiffNodes.forEach((node) => {
					(node as AddedDiffNode).deletedDiffNode = deletedDiffNodes[0] as DeletedDiffNode;
				});

				// todo: сделать для удаленных
				diffNodes.push(...addedDiffNodes);
				diffNodes.push(...deletedDiffNodes);
			} else {
				// changed attrs
				if (step.slice.content.childCount === 1 && step.slice.content.child(0).childCount === 0) {
					const nodeFromPosition = getNodeByPos(
						step.from,
						newDoc,
						(node) => node.type.name === step.slice.content.child(0).type.name,
					);
					const lastLogsChangedContext = logs.stepsLogs.changedContext.push({}) - 1;
					diffNodes.push(
						...getDiffNodesByPos(
							newDoc,
							nodeFromPosition.position,
							nodeFromPosition.position + nodeFromPosition.node.nodeSize,
							"changedContext",
							newPaths,
							logs.stepsLogs.changedContext[lastLogsChangedContext],
						),
					);
				} else {
					const lastLogsAdded = logs.stepsLogs.added.push({}) - 1;
					diffNodes.push(
						...getDiffNodesByPos(
							newDoc,
							step.from,
							step.to,
							"added",
							newPaths,
							logs.stepsLogs.added[lastLogsAdded],
						),
					);
					const lastLogsDeleted = logs.stepsLogs.deleted.push({}) - 1;
					diffNodes.push(
						...getDiffNodesByPos(
							oldDoc,
							originalFrom,
							originalTo,
							"deleted",
							oldPaths,
							logs.stepsLogs.deleted[lastLogsDeleted],
						),
					);
				}
			}
		} else if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) {
			const lastLogsChangedContext = logs.stepsLogs.changedContext.push({}) - 1;
			diffNodes.push(
				...getDiffNodesByPos(
					newDoc,
					step.from,
					step.to,
					"changedContext",
					newPaths,
					logs.stepsLogs.changedContext[lastLogsChangedContext],
				),
			);
		}
	});
	logs.diffNodes = diffNodes;
	logs.stepsLogs = {
		added: logs.stepsLogs.added.filter((x) => x && Object.keys(x).length),
		deleted: logs.stepsLogs.deleted.filter((x) => x && Object.keys(x).length),
		changedContext: logs.stepsLogs.changedContext.filter((x) => x && Object.keys(x).length),
	};
	if (shouldLog) console.log(`diff logs:`, logs);
	return diffNodes;
}

export default getDiffNodes;
