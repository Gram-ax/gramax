import type { SortState } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { useTableProps } from "@ext/markdown/elements/table/render/components/FilterAndSort/TablePropsProvider";
import FilterAndSortButton from "@ext/markdown/elements/table/render/components/FilterAndSortButton";

export interface TableCellProps {
	children: React.ReactNode;
	colspan: number;
	colwidth: number[];
	rowspan: number;
	cellIndex: number;
	isPrint: boolean;
}

const TableCell = ({ cellIndex, children, colwidth, isPrint, ...otherProps }: TableCellProps) => {
	const isFirstRow = typeof cellIndex === "number";
	const { tableProps } = useTableProps() || {};
	const { columnsValues, onFilterChange, active, canSort, onSortChange } = tableProps || {};

	const handleFilterChange = (excluded: string[]) => {
		if (onFilterChange) {
			onFilterChange(cellIndex, excluded);
		}
	};

	const handleSortChange = (sortState: SortState) => {
		if (onSortChange) {
			onSortChange(cellIndex, sortState);
		}
	};

	return (
		<td {...otherProps}>
			<div>{children}</div>
			{!isPrint && isFirstRow && columnsValues && (
				<FilterAndSortButton
					canSort={canSort}
					columnValues={columnsValues[cellIndex]}
					filteredValues={active.filter[cellIndex] || []}
					handleFilterChange={handleFilterChange}
					handleSortChange={handleSortChange}
					sort={active.sort[cellIndex]}
				/>
			)}
		</td>
	);
};

export default TableCell;
