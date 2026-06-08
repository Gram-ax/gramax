import {
	type FilterAndSortProps,
	type FilterState,
	type SortRecord,
	type SortState,
	type TableDataExtended,
	TableHeaderTypes,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import {
	getColumnsValues,
	getFilterChange,
	useWatchSort,
} from "@ext/markdown/elements/table/render/components/FilterAndSort/sortAndFilterReact";
import {
	canSortTable,
	getSaved,
	getTableData,
	restoreOrder,
	sortOrder,
} from "@ext/markdown/elements/table/render/logic/sortFilterUtilsRender";
import {
	type MutableRefObject,
	type ReactElement,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

type useFilterAndSortRenderFunction = (
	header: string,
	tableRef: MutableRefObject<HTMLTableElement>,
	rows: {
		headerRow: ReactElement;
		rowsArray: ReactElement[];
	},
	setSortRows,
	savedSortingOrder: number[],
) => FilterAndSortProps;

export const useFilterAndSortRender: useFilterAndSortRenderFunction = (
	header,
	tableRef,
	rows,
	setSortRows,
	savedSortingOrder,
) => {
	const [tableData, setTableData] = useState<TableDataExtended>();
	const stringifyTableDataRef = useRef("");
	const saved = useMemo(() => getSaved(rows.headerRow), [rows.headerRow]);
	const canSort = useMemo(() => canSortTable(rows), [rows]);

	const [activeFilter, setActiveFilter] = useState<FilterState>(saved.filter ?? {});
	const [activeSort, setActiveSort] = useState<SortRecord>(saved.sort ?? {});
	const [sortingOrder, setSortingOrder] = useState<number[]>(savedSortingOrder ?? []);

	useLayoutEffect(() => {
		const el = tableRef.current;
		if (!el) return;

		if (header !== TableHeaderTypes.ROW && header !== TableHeaderTypes.BOTH) return;

		const calculateTableData = () => {
			const newTableData = getTableData(el);
			const newStringifyTableData = JSON.stringify(newTableData);

			if (newStringifyTableData === stringifyTableDataRef.current) return;
			setTableData(newTableData);
			stringifyTableDataRef.current = newStringifyTableData;
		};

		calculateTableData();
		const mutationObserver = new MutationObserver(calculateTableData);

		mutationObserver.observe(tableRef.current, { childList: true, subtree: true });

		return () => {
			mutationObserver.disconnect();
		};
	}, [header, tableRef.current]);

	const onSortChange = useCallback(
		(colIndex: number, sortState: SortState) => {
			const next = { ...activeSort };
			let newSortingOrder = [...sortingOrder];
			if (sortState) {
				next[colIndex] = sortState;
				newSortingOrder.push(colIndex);
			} else {
				delete next[colIndex];
				newSortingOrder = newSortingOrder.filter((order) => order !== colIndex);
			}
			setActiveSort(next);
			setSortingOrder(newSortingOrder);
		},
		[activeSort, sortingOrder],
	);

	const sortcallback = useCallback(() => {
		const sortedRows = sortOrder(rows, tableData, activeSort, sortingOrder);
		setSortRows(sortedRows);
	}, [rows, tableData, activeSort, sortingOrder, setSortRows]);

	const restorecallback = useCallback(() => {
		const restored = restoreOrder(rows.rowsArray);
		setSortRows(restored);
	}, [rows, setSortRows]);

	useWatchSort(tableData, activeSort, sortcallback, restorecallback);
	const onFilterChange = useCallback((colIndex: number, excluded: string[]) => {
		setActiveFilter((prev) => getFilterChange(colIndex, excluded, prev));
	}, []);

	const columnsValues = getColumnsValues(tableData);

	return {
		tableData,
		canSort,
		saved,
		active: {
			filter: activeFilter,
			sort: activeSort,
			sortingOrder,
		},
		onFilterChange,
		onSortChange,
		columnsValues,
	};
};
