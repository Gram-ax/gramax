import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import type { FilterState, SortRecord, TableDataExtended } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { hasActiveEntries } from "@ext/markdown/elements/table/render/logic/sortFilterUtilsRender";
import { useMemo } from "react";

export const useWatchSort = (
	tableData: TableDataExtended,
	activeSort: SortRecord,
	sortcallback: () => void,
	restorecallback: () => void,
) => {
	const { start: startSortRow, cancel: cancelSortRow } = useDebounce(sortcallback, 100);
	const { start: startSortTableData } = useDebounce(sortcallback, 1000);

	useWatch(() => {
		if (!tableData) return;

		if (hasActiveEntries(activeSort)) {
			startSortRow();
		} else {
			cancelSortRow();
			restorecallback();
		}
	}, [activeSort]);

	useWatch(() => {
		if (!tableData || !hasActiveEntries(activeSort)) return;
		startSortTableData();
	}, [tableData]);
};

export const getFilterChange = (colIndex: number, excluded: string[], prev: FilterState) => {
	const next = { ...prev, [colIndex]: excluded };
	if (!excluded.length) delete next[colIndex];

	return next;
};

export const getColumnsValues = (tableData: TableDataExtended) =>
	useMemo(() => {
		if (!tableData) return;
		const headers = tableData.rows?.[0].cells ?? [];
		const datarows = tableData.rows.slice(1);

		const columnsValues: string[][] = [];
		for (let i = 0; i < headers.length; ) {
			const header = headers[i];
			columnsValues.push([...new Set(datarows.map((row) => row.cells[i]?.text ?? ""))]);
			i += header.colspan;
		}
		return columnsValues;
	}, [tableData]);
