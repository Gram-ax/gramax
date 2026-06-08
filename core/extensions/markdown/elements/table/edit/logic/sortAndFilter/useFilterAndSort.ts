import useWatch from "@core-ui/hooks/useWatch";
import saveSortAndFilter from "@ext/markdown/elements/table/edit/logic/sortAndFilter/saveSortAndFilter";
import {
	getSaved,
	getTableData,
	restoreOrder,
	sortRows,
} from "@ext/markdown/elements/table/edit/logic/sortAndFilter/sortFilterUtils";
import type {
	FilterAndSort,
	FilterAndSortProps,
	FilterState,
	SortRecord,
	SortState,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import {
	getColumnsValues,
	getFilterChange,
	useWatchSort,
} from "@ext/markdown/elements/table/render/components/FilterAndSort/sortAndFilterReact";
import { hasActiveEntries } from "@ext/markdown/elements/table/render/logic/sortFilterUtilsRender";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { useCallback, useMemo, useState } from "react";

const canSortTable = (node: Node) => {
	const cells = node.children.flatMap((rows) => rows.children);
	return cells.every(
		(c) => (!c.attrs.colspan || c.attrs.colspan === 1) && (!c.attrs.rowspan || c.attrs.rowspan === 1),
	);
};

const useFilterAndSort = (node: Node, editor: Editor, pos: number): FilterAndSortProps => {
	const tableData = useMemo(() => getTableData(node), [node]);
	const canSort = canSortTable(node);
	const saved = getSaved(node);

	const [activeFilter, setActiveFilter] = useState<FilterState>(saved.filter ?? {});
	const [activeSort, setActiveSort] = useState<SortRecord>(saved.sort ?? {});
	const [sortingOrder, setSortingOrder] = useState<number[]>(saved.sortingOrder ?? []);

	useWatch(() => {
		setActiveFilter(saved.filter);
		setActiveSort(saved.sort);
	}, [tableData?.numCols]);

	const sorted = useMemo(() => hasActiveEntries(activeSort), [activeSort]);

	const saveSortAndFilterCallback = useCallback(
		(newSortFilter: FilterAndSort) => {
			saveSortAndFilter(editor, pos, { filter: activeFilter, sort: activeSort, sortingOrder, ...newSortFilter });
		},
		[editor, pos, activeFilter, activeSort, sortingOrder],
	);

	const onSortChange = useCallback(
		(colIndex: number, sortState: SortState) => {
			const next = { ...activeSort };
			let newSortingOrder = [...sortingOrder];
			if (sortState) {
				next[colIndex] = sortState;

				if (!newSortingOrder.includes(colIndex)) newSortingOrder.push(colIndex);
			} else {
				delete next[colIndex];
				newSortingOrder = newSortingOrder.filter((order) => order !== colIndex);
			}
			setActiveSort(next);
			setSortingOrder(newSortingOrder);

			const newSortFilter = { sort: next, sortingOrder: newSortingOrder } as FilterAndSort;
			saveSortAndFilterCallback(newSortFilter);
		},
		[saveSortAndFilterCallback, activeSort, sortingOrder],
	);

	const sortRowsCallback = useCallback(
		() => sortRows(tableData, activeSort, sortingOrder, editor, pos),
		[tableData, activeSort, sortingOrder, editor, pos],
	);
	const restorecallback = useCallback(() => restoreOrder(editor, pos), [editor, pos]);

	useWatchSort(tableData, activeSort, sortRowsCallback, restorecallback);

	const columnsValues = getColumnsValues(tableData);

	const onFilterChange = useCallback(
		(colIndex: number, excluded: string[]) => {
			const newFilter = getFilterChange(colIndex, excluded, activeFilter);
			setActiveFilter(newFilter);

			const newSortFilter = { filter: newFilter } as FilterAndSort;
			saveSortAndFilterCallback(newSortFilter);
		},
		[saveSortAndFilterCallback, activeFilter],
	);

	return {
		tableData,
		canSort,
		active: { filter: activeFilter, sort: activeSort, sortingOrder },
		saved,
		onFilterChange,
		onSortChange,
		sorted,
		columnsValues,
	};
};

export default useFilterAndSort;
