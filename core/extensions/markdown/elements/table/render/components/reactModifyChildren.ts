import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import filterAndSortModifyChildren from "@ext/markdown/elements/table/render/components/FilterAndSort/filterAndSortModifyChildren";
import { Children, cloneElement, type ReactElement } from "react";

const STICKY_FIRST_COLUMN_CELL_ATTR = "data-sticky-first-column-cell";
const STICKY_AFTER_FIRST_COLUMN_CELL_ATTR = "data-sticky-after-first-column-cell";

const getCellRowspan = (cell: ReactElement) => Number(cell.props.rowspan ?? cell.props.rowSpan ?? 1) || 1;

const stickyModifyChildren = (rows: ReactElement | ReactElement[], header = TableHeaderTypes.NONE) => {
	if (!rows || (header !== TableHeaderTypes.BOTH && header !== TableHeaderTypes.COLUMN)) return rows;

	let firstColumnOccupiedUntil = -1;

	return Children.map(rows, (row, rowIndex) => {
		if (!row || typeof row !== "object" || !row.props) return row;

		const firstColumnCovered = rowIndex <= firstColumnOccupiedUntil;
		const cells = Children.map(row.props.children, (cell, cellIndex) => {
			if (!cell || typeof cell !== "object" || !cell.props) return cell;

			return cloneElement(cell, {
				[STICKY_FIRST_COLUMN_CELL_ATTR]: !firstColumnCovered && cellIndex === 0 ? "true" : undefined,
				[STICKY_AFTER_FIRST_COLUMN_CELL_ATTR]:
					(firstColumnCovered && cellIndex === 0) || (!firstColumnCovered && cellIndex === 1)
						? "true"
						: undefined,
			});
		});

		if (!firstColumnCovered) {
			const firstCell = Children.toArray(row.props.children)[0];
			if (firstCell && typeof firstCell === "object" && "props" in firstCell) {
				firstColumnOccupiedUntil = Math.max(firstColumnOccupiedUntil, rowIndex + getCellRowspan(firstCell) - 1);
			}
		}

		return cloneElement(row, {}, cells);
	});
};

const reactModifyChildren = (rows: ReactElement, header = TableHeaderTypes.NONE) => {
	const filterAndSortRows = filterAndSortModifyChildren(rows, header);
	return stickyModifyChildren(filterAndSortRows, header);
};

export default reactModifyChildren;
