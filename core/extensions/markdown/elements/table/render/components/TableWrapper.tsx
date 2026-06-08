import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import type { FilterState, TableDataExtended } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { type DetailedHTMLProps, type HTMLAttributes, useCallback, useMemo, useState } from "react";

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

const TableWrapperDiv = styled.div<{ filterCSS: string }>`
	width: max-content;
	padding: ${PADDING_TOP_BOTTOM} ${PADDING_LEFT_RIGHT};

	table {
		display: table;
		border-collapse: separate;
		padding: 0;
		border-top: 0.625px solid var(--color-table-border);
		border-bottom: 0.625px solid var(--color-table-border);

		tbody {
			tr {
				td {
					border: 0.625px solid var(--color-table-border) ;
				}

				td:last-of-type {
					border-right: 1.25px solid var(--color-table-border) ;
				}

				td:first-of-type {
					border-left: 1.25px solid var(--color-table-border) ;
				}
			}
			tr:hover {
				.button-container:not(.filtered) {
					opacity: 0.5
				}
			}
		}
	}

	${({ filterCSS }) => filterCSS}
`;

const TableWrapper = ({ tableData, activeFilter, children, ...rest }: TableWrapperProps) => {
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

	const filterCSS = useMemo(() => {
		const { hiddenRowIndices, protectedCells } = hiddenRows;
		if (!hiddenRowIndices.length) return "";

		return `> table > tbody { ${hiddenRowIndices
			.map((rowIndex) => {
				const currentProtectedCells = protectedCells[rowIndex];
				const protectedCellsSelector = currentProtectedCells
					? `:not(${Array.from(currentProtectedCells)
							.map((cellIndex) => `td:nth-of-type(${cellIndex + 1})`)
							.join(",")})`
					: "";

				return `> tr:nth-of-type(${rowIndex + 1}) {
					height: 0;

					> td${protectedCellsSelector} {
						border: none;
						font-size: 0;
						padding: 0;
					    overflow: hidden;
						> * {
							height: 0;
						}
					}
				}`;
			})
			.join(" ")}`;
	}, [hiddenRows]);

	return (
		<TableWrapperDiv data-table-wrapper="" filterCSS={filterCSS} {...rest}>
			{children}
		</TableWrapperDiv>
	);
};

export default TableWrapper;
