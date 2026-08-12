import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import { cn } from "@core-ui/utils/cn";
import type { FilterState, TableDataExtended } from "@ext/markdown/elements/table/edit/model/tableTypes";
import {
	type CSSProperties,
	type DetailedHTMLProps,
	type HTMLAttributes,
	useCallback,
	useId,
	useMemo,
	useState,
} from "react";

export const CELL_MIN_WIDTH = "3em";
export const PADDING_LEFT_RIGHT = "1.5em";
export const PADDING_TOP_BOTTOM = "1.25em";

const computeHiddenRows = (tableData: TableDataExtended | null, filter: FilterState) => {
	if (!tableData || tableData.numRows <= 1) return { hiddenRowIndices: [], protectedCells: [] };

	const activeFilters = Object.entries(filter)
		.map(([k, v]) => [Number(k), v] as [number, string[]])
		.filter(([, vals]) => vals.length > 0);

	if (!activeFilters.length) return { hiddenRowIndices: [], protectedCells: [] };
	const firstRow = tableData.rows[0];

	const virtualFilters: typeof activeFilters = activeFilters.map(([colIndex, excluded]) => {
		const cell = firstRow.cells.find((cell) => cell.realColStart === colIndex);
		return [cell.visualColStart, excluded];
	});
	const { rows, numCols } = tableData;

	const hiddenRowIndices: number[] = [];
	const protectedCells: Record<number, Set<number>> = {};

	for (let i = 0; i < rows.length - 1; i++) {
		const gridRowIndex = i + 1;
		const row = rows[gridRowIndex];

		const shouldHide = virtualFilters.some(([colIndex, excluded]) =>
			excluded.includes(row.cells[colIndex].text ?? ""),
		);

		if (shouldHide) {
			hiddenRowIndices.push(gridRowIndex);
		}
	}

	hiddenRowIndices.forEach((currentRowIndex) => {
		for (let col = 0; col < numCols; col++) {
			const cell = rows[currentRowIndex].cells[col];

			if (!cell || cell.rowspan <= 1 || cell.realRowStart !== currentRowIndex) continue;

			const startRow = cell.realRowStart;
			const endRow = startRow + cell.rowspan;

			for (let r = startRow; r < endRow; r++) {
				if (r === 0) continue;

				if (!hiddenRowIndices.includes(r)) {
					if (!protectedCells[currentRowIndex]) protectedCells[currentRowIndex] = new Set();
					protectedCells[currentRowIndex].add(cell.realColStart);
					break;
				}
			}
		}
	});

	return { hiddenRowIndices, protectedCells };
};

interface TableWrapperProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	tableData?: TableDataExtended | null;
	activeFilter?: FilterState;
}

type HiddenRows = ReturnType<typeof computeHiddenRows>;

const getFilterCSS = (filterClassName: string, hiddenRows: HiddenRows) => {
	const { hiddenRowIndices, protectedCells } = hiddenRows;
	if (!hiddenRowIndices.length) return "";

	return hiddenRowIndices
		.map((rowIndex) => {
			const currentProtectedCells = protectedCells[rowIndex];
			const protectedCellsSelector = currentProtectedCells
				? `:not(${Array.from(currentProtectedCells)
						.map((cellIndex) => `td:nth-of-type(${cellIndex + 1})`)
						.join(",")})`
				: "";
			const rowSelector = `.${filterClassName} > table > tbody > tr:nth-of-type(${rowIndex + 1})`;

			return `${rowSelector} {
				height: 0;
			}

			${rowSelector} > td${protectedCellsSelector} {
				border: none;
				font-size: 0;
				padding: 0;
				overflow: hidden;
			}

			${rowSelector} > td${protectedCellsSelector} > * {
				height: 0;
			}`;
		})
		.join(" ");
};

const TableFilterStyles = ({ filterClassName, hiddenRows }: { filterClassName: string; hiddenRows: HiddenRows }) => {
	const filterCSS = useMemo(() => getFilterCSS(filterClassName, hiddenRows), [filterClassName, hiddenRows]);

	if (!filterCSS) return null;
	return <style>{filterCSS}</style>;
};

const TableWrapper = ({ tableData, activeFilter, children, className, style, ...rest }: TableWrapperProps) => {
	const filterClassName = `table-filter-${useId().replace(/:/g, "")}`;
	const getHiddenRows = useCallback(
		() => computeHiddenRows(tableData ?? null, activeFilter ?? {}),
		[tableData, activeFilter],
	);

	const [hiddenRows, setHiddenRows] = useState(getHiddenRows());
	const { start: startFilter, cancel } = useDebounce(() => setHiddenRows(getHiddenRows()), 1000);

	useWatch(() => {
		startFilter();
	}, [tableData]);

	useWatch(() => {
		cancel();
		setHiddenRows(getHiddenRows());
	}, [activeFilter, tableData?.numRows]);

	const wrapperStyle = {
		...style,
		"--table-border-width": "0.625px",
		"--table-wrapper-padding-x": PADDING_LEFT_RIGHT,
		"--table-wrapper-padding-y": PADDING_TOP_BOTTOM,
	} as CSSProperties;

	return (
		<div
			className={cn(
				filterClassName,
				className,
				"w-max px-[var(--table-wrapper-padding-x)] py-[var(--table-wrapper-padding-y)]",
				"[&>table]:table [&>table]:border-separate [&>table]:p-0",
				"[&>table]:[border-bottom:var(--table-border-width)_solid_var(--color-table-border)]",
				"[&>table]:[border-top:var(--table-border-width)_solid_var(--color-table-border)]",
				"[.article_&>table]:table [.article_&>table]:border-separate [.article_&>table]:p-0",
				"[.article_&>table]:[border-bottom:var(--table-border-width)_solid_var(--color-table-border)]",
				"[.article_&>table]:[border-top:var(--table-border-width)_solid_var(--color-table-border)]",
				"[&>table>tbody>tr>td]:[border:var(--table-border-width)_solid_var(--color-table-border)]",
				"[&>table>tbody>tr>td:first-of-type]:[border-left:calc(var(--table-border-width)*2)_solid_var(--color-table-border)]",
				"[&>table>tbody>tr>td:last-of-type]:[border-right:calc(var(--table-border-width)*2)_solid_var(--color-table-border)]",
				"[&>table>tfoot>tr>td:first-of-type]:[border-left:calc(var(--table-border-width)*2)_solid_var(--color-table-border)]",
				"[&>table>tfoot>tr>td:last-of-type]:[border-right:calc(var(--table-border-width)*2)_solid_var(--color-table-border)]",
				"[&>table>tbody>tr:hover_.button-container:not(.filtered)]:opacity-50",
			)}
			data-table-wrapper=""
			style={wrapperStyle}
			{...rest}
		>
			<TableFilterStyles filterClassName={filterClassName} hiddenRows={hiddenRows} />
			{children}
		</div>
	);
};

export default TableWrapper;
