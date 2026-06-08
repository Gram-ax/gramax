import { useTableProps } from "@ext/markdown/elements/table/edit/logic/tablePropsStore";
import type { SortState } from "@ext/markdown/elements/table/edit/model/tableTypes";
import FilterAndSortButton from "@ext/markdown/elements/table/render/components/FilterAndSortButton";
import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useMemo } from "react";

const FilterAndSortButtonWrapper = ({ tablePos, cellIndex }: { tablePos: number; cellIndex: number }) => {
	const { columnsValues, onFilterChange, active, canSort, onSortChange } = useTableProps(tablePos) || {};
	const handleFilterChange = (excluded: string[]) => onFilterChange(cellIndex, excluded);
	const handleSortChange = (sortState: SortState) => onSortChange(cellIndex, sortState);

	return (
		columnsValues && (
			<FilterAndSortButton
				canSort={canSort}
				columnValues={columnsValues[cellIndex]}
				filteredValues={active.filter[cellIndex] || []}
				handleFilterChange={handleFilterChange}
				handleSortChange={handleSortChange}
				sort={active.sort[cellIndex]}
			/>
		)
	);
};

const CellComponent = ({ getPos, view }: NodeViewProps) => {
	const cellPos = getPos();
	const resolvedPos = useMemo(() => view.state.doc.resolve(cellPos), [view, cellPos]);

	const cellIndex = resolvedPos.index(resolvedPos.depth);
	const rowIndex = resolvedPos.index(resolvedPos.depth - 1);
	const isFirstRow = rowIndex === 0;

	const tablePos = isFirstRow ? resolvedPos.before(resolvedPos.depth - 1) : 0;

	return (
		<NodeViewWrapper>
			<NodeViewContent />
			{isFirstRow && <FilterAndSortButtonWrapper cellIndex={cellIndex} tablePos={tablePos} />}
		</NodeViewWrapper>
	);
};

export default CellComponent;
