import type NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";
import type { SortRecord, TableDataExtended } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { getRowMoves } from "@ext/markdown/elements/table/render/logic/sortFilterUtilsRender";
import type { JSONContent } from "@tiptap/core";

const canSortFilter = (node: JSONContent) => {
	const header = node.attrs?.header;
	return header === "row" || header === "both";
};

const canSortTable = (node: JSONContent) => {
	const cells = node.content.flatMap((rows) => rows.content || []);
	return cells.every(
		(c) => (!c.attrs?.colspan || c.attrs.colspan === 1) && (!c.attrs?.rowspan || c.attrs.rowspan === 1),
	);
};

const cleanSortFilterAttrs = (node: JSONContent): JSONContent => {
	const canApply = canSortFilter(node);
	if (!node.content?.length) return node;

	const canSort = canSortTable(node);
	let changed = false;

	const cleanedRows = node.content.map((row, rowIndex) => {
		const cells = row.content || [];
		if (!cells.length) return row;

		const cleanedCells = cells.map((cell) => {
			const hasFilter = !!cell.attrs?.filter;
			const hasSort = !!cell.attrs?.sort;

			const shouldRemove = !canApply || rowIndex !== 0;

			if (shouldRemove && (hasFilter || hasSort)) {
				changed = true;
				return {
					...cell,
					attrs: { ...cell.attrs, filter: null, sort: null },
				};
			}

			if (!canSort && hasSort) {
				changed = true;
				return { ...cell, attrs: { ...cell.attrs, sort: null } };
			}

			return cell;
		});

		return cleanedCells !== cells ? { ...row, content: cleanedCells } : row;
	});

	return changed ? { ...node, content: cleanedRows } : node;
};

const validateSortingOrder = (node: JSONContent): JSONContent => {
	if (!canSortFilter(node)) return node;

	const headerRow = node.content?.[0];
	if (!headerRow) return node;

	const activeSort: Record<number, "asc" | "desc"> = {};

	headerRow.content?.forEach((cell, colIndex) => {
		const sort = cell.attrs?.sort;
		if (sort === "asc" || sort === "desc") {
			activeSort[colIndex] = sort;
		}
	});

	const currentOrder: string[] = node.attrs?.sortingOrder || [];
	if (Object.keys(activeSort).length === 0) {
		if (currentOrder.length > 0) {
			return {
				...node,
				attrs: { ...node.attrs, sortingOrder: [] },
			};
		}
		return node;
	}

	const newOrder = currentOrder.filter((col) => activeSort[col] !== undefined).map((col) => parseInt(col, 10));

	Object.keys(activeSort)
		.map(Number)
		.forEach((col) => {
			if (!newOrder.includes(col)) {
				newOrder.push(col);
			}
		});

	return {
		...node,
		attrs: { ...node.attrs, sortingOrder: newOrder },
	};
};

const getTableData = (node: JSONContent): TableDataExtended | null => {
	const nodeRows = node.content || [];
	if (nodeRows.length === 0) return null;

	let numCols = 0;
	const firstRow = nodeRows[0];

	if (firstRow?.content) {
		for (const cell of firstRow.content) {
			numCols += cell.attrs?.colspan || 1;
		}
	} else {
		return null;
	}

	const numRows = nodeRows.length;
	const rows: TableDataExtended["rows"] = Array.from({ length: numRows }, () => ({
		cells: Array(numCols).fill(null),
	}));

	const colOccupiedUntil = new Array(numCols).fill(-1);

	nodeRows.forEach((rowNode, currentRowIdx) => {
		rows[currentRowIdx].initialOrder = rowNode.attrs?.initialOrder;
		if (!rowNode.content) return;

		let visualCol = 0;

		while (visualCol < numCols && currentRowIdx <= colOccupiedUntil[visualCol]) {
			visualCol++;
		}

		rowNode.content.forEach((cellNode) => {
			while (visualCol < numCols && currentRowIdx <= colOccupiedUntil[visualCol]) {
				visualCol++;
			}

			if (visualCol >= numCols) return;

			const colspan = cellNode.attrs?.colspan || 1;
			const rowspan = cellNode.attrs?.rowspan || 1;
			const text = extractText(cellNode);

			for (let r = 0; r < rowspan; r++) {
				const targetRow = currentRowIdx + r;
				if (targetRow >= numRows) break;

				for (let c = 0; c < colspan; c++) {
					const targetCol = visualCol + c;
					if (targetCol >= numCols) continue;

					const targetRowCells = rows[targetRow].cells;
					targetRowCells[targetCol] = {
						text,
						rowspan,
						colspan,
						realRowStart: currentRowIdx,
						visualColStart: visualCol,
						realColStart: rowNode.content!.indexOf(cellNode),
					};
				}
			}

			for (let c = 0; c < colspan; c++) {
				const targetCol = visualCol + c;
				if (targetCol < numCols) {
					colOccupiedUntil[targetCol] = currentRowIdx + rowspan - 1;
				}
			}

			visualCol += colspan;
		});
	});

	return {
		rows,
		numRows,
		numCols,
	};
};

const tableNodeTransform: NodeTransformerFunc = (node) => {
	if (node?.type !== "table") {
		return { isSet: false, value: node };
	}

	let cleaned = cleanSortFilterAttrs(node);

	cleaned = validateSortingOrder(cleaned);

	if (!canSortFilter(cleaned) || !cleaned.attrs.sortingOrder) {
		return { isSet: cleaned !== node, value: cleaned };
	}

	const headerRow = cleaned.content?.[0];
	if (!headerRow) {
		return { isSet: cleaned !== node, value: cleaned };
	}

	const sortEntry: SortRecord = {};
	headerRow.content?.filter((cell, i) => {
		const colSort = cell.attrs.sort;
		if (colSort) sortEntry[i] = colSort;
	});

	const tableData = getTableData(cleaned);

	if (!tableData) {
		return { isSet: cleaned !== node, value: cleaned };
	}
	const moves = getRowMoves(tableData, sortEntry, cleaned.attrs.sortingOrder);

	const alreadySorted = Object.keys(moves).length === 0;
	if (alreadySorted) {
		return { isSet: cleaned !== node, value: cleaned };
	}
	const bodyRows = cleaned.content.slice(1);

	const sortedBodyRows = [...bodyRows].sort((a, b) => {
		const aIdx = bodyRows.indexOf(a) + 1;
		const bIdx = bodyRows.indexOf(b) + 1;
		const newA = moves[aIdx] ?? aIdx;
		const newB = moves[bIdx] ?? bIdx;
		return newA - newB;
	});

	const newContent: JSONContent[] = [
		{
			...headerRow,
			attrs: { ...headerRow.attrs, initialOrder: 0 },
		},
		...sortedBodyRows.map((row) => {
			const originalIndex = bodyRows.indexOf(row) + 1;
			const initialOrder = row.attrs?.initialOrder ?? originalIndex;

			return {
				...row,
				attrs: {
					...row.attrs,
					initialOrder,
				},
			};
		}),
	];

	const finalNode: JSONContent = {
		...cleaned,
		content: newContent,
	};

	return {
		isSet: true,
		value: finalNode,
	};
};

const extractText = (node: JSONContent): string => {
	if (node.text) return node.text;
	if (!node.content) return "";
	return node.content.map(extractText).join("");
};

export default tableNodeTransform;
