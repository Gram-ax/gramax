import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Children, cloneElement, type ReactElement } from "react";

const filterAndSortModifyChildren = (rows: ReactElement, header = TableHeaderTypes.NONE) => {
	if (!rows || (header !== TableHeaderTypes.BOTH && header !== TableHeaderTypes.ROW)) return rows;

	const newRows = Children.map(rows, (row, rowIndex) => {
		if (rowIndex || !row || typeof row !== "object" || !row.props) return row;

		const cells = row.props.children;
		if (!cells) return row;

		const modifiedCells = Children.map(cells, (cell, cellIndex) => {
			if (!cell || typeof cell !== "object" || !cell.props) return cell;
			return cloneElement(cell, { cellIndex });
		});
		return cloneElement(row, {}, modifiedCells);
	});
	return newRows;
};

export default filterAndSortModifyChildren;
