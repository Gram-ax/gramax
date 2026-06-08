import type { Node } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

export const updateSortingOrderOnDeleteCol = (tr: Transaction, colToRemove: number[]) => {
	if (!colToRemove.length) return;
	const anchor = tr.selection.$anchor;

	let tableNode: Node = null;
	let tablePos = -1;

	for (let depth = anchor.depth; depth > 0; depth--) {
		const node = anchor.node(depth);
		if (node.type.name === "table") {
			tableNode = node;
			tablePos = anchor.before(depth);
			break;
		}
	}
	if (!tableNode) return;

	let newSortingOrder = tableNode.attrs.sortingOrder;
	if (!newSortingOrder) return;

	for (let i = 0; i < colToRemove.length; i++) {
		const col = colToRemove[i];

		newSortingOrder = newSortingOrder
			.filter((index) => index !== col)
			.map((index) => (index > col ? index - 1 : index));
	}

	tr.setNodeMarkup(tablePos, null, {
		...tableNode.attrs,
		sortingOrder: newSortingOrder,
	});
};

export const updateSortingOrderOnAddCol = (tr: Transaction) => {
	const anchor = tr.selection.$anchor;

	let tableNode: Node = null;
	let tablePos = -1;

	for (let depth = anchor.depth; depth > 0; depth--) {
		const node = anchor.node(depth);
		if (node.type.name === "table") {
			tableNode = node;
			tablePos = anchor.before(depth);
			break;
		}
	}
	if (!tableNode || !tableNode.attrs.sortingOrder) return;

	const oldSortingOrder: number[] = [...tableNode.attrs.sortingOrder];
	if (!oldSortingOrder) return;

	const sortColumns = [];

	tableNode.child(0).forEach((cell, _, i) => {
		const sort = cell.attrs.sort;
		if (sort) sortColumns.push(i);
	});

	oldSortingOrder.sort((a, b) => a - b);
	const sortingOrderRecord = {};

	for (let i = 0; i < oldSortingOrder.length; i++) {
		sortingOrderRecord[oldSortingOrder[i]] = sortColumns[i];
	}

	const newSortingOrder = tableNode.attrs.sortingOrder.map((colIndex: number) => sortingOrderRecord[colIndex]);
	tr.setNodeMarkup(tablePos, null, {
		...tableNode.attrs,
		sortingOrder: newSortingOrder,
	});
};
