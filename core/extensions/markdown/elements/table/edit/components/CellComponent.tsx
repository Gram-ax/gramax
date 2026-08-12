import tablePropsStore from "@ext/markdown/elements/table/edit/logic/tablePropsStore";
import type { SortState } from "@ext/markdown/elements/table/edit/model/tableTypes";
import FilterAndSortButton from "@ext/markdown/elements/table/render/components/FilterAndSortButton";
import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useCallback, useMemo } from "react";

const FilterAndSortButtonWrapper = ({ tablePos, cellIndex }: { tablePos: number; cellIndex: number }) => {
	const { columnsValues, onFilterChange, active, canSort, onSortChange } =
		tablePropsStore.useFilterAndSortProps(tablePos) || {};
	const handleFilterChange = useCallback(
		(excluded: string[]) => onFilterChange?.(cellIndex, excluded),
		[cellIndex, onFilterChange],
	);
	const handleSortChange = useCallback(
		(sortState: SortState) => onSortChange?.(cellIndex, sortState),
		[cellIndex, onSortChange],
	);

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
	const tablePos = resolvedPos.before(resolvedPos.depth - 1);

	return (
		<NodeViewWrapper>
			<NodeViewContent />
			<FilterAndSortButtonWrapper cellIndex={cellIndex} tablePos={tablePos} />
		</NodeViewWrapper>
	);
};

export default CellComponent;
