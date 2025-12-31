import { classNames } from "@components/libs/classNames";
import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Children, cloneElement } from "react";

const modifyChildren = (children: any, header = TableHeaderTypes.NONE): any => {
	if (!children || header === TableHeaderTypes.NONE) return children;

	const rows = children?.props?.children;

	const newRows = Children.map(rows, (row, rowIndex) => {
		if (!row || typeof row !== "object" || !row.props) return row;

		const cells = row.props.children;
		if (!cells) return row;

		const modifiedCells = Children.map(cells, (cell, cellIndex) => {
			if (!cell || typeof cell !== "object" || !cell.props) return cell;

			let rowHeader = false,
				colHeader = false;

			if ((header === TableHeaderTypes.ROW || header === TableHeaderTypes.BOTH) && rowIndex === 0) {
				rowHeader = true;
			}

			if ((header === TableHeaderTypes.COLUMN || header === TableHeaderTypes.BOTH) && cellIndex === 0) {
				colHeader = true;
			}

			if (colHeader || rowHeader) {
				const existingClassName = cell.props.className || "";
				const newClassName = classNames(
					"cell-header",
					{
						["cell-header-row"]: rowHeader,
						["cell-header-col"]: colHeader,
					},
					[existingClassName],
				);
				return cloneElement(cell, { className: newClassName });
			}
			return cell;
		});
		return cloneElement(row, {}, modifiedCells);
	});
	return cloneElement(children, {}, newRows);
};

export default modifyChildren;
