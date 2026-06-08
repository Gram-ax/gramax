import type { FilterAndSort } from "@ext/markdown/elements/table/edit/logic/sortAndFilter/sortFilterUtils";
import type { Editor } from "@tiptap/core";

const saveSortAndFilter = (editor: Editor, pos: number, newSortFilter: FilterAndSort) => {
	const { state, view } = editor;
	const tr = state.tr;

	const tableNode = state.doc.nodeAt(pos);
	if (!tableNode) return;

	const firstRow = tableNode.firstChild;
	if (!firstRow) return;

	const offset = pos + 1;

	tr.setNodeMarkup(pos, undefined, {
		...tableNode.attrs,
		sortingOrder: newSortFilter.sortingOrder ?? [],
	});

	firstRow.forEach((cell, cellOffset, colIndex) => {
		const cellPos = offset + cellOffset + 1;

		const filter = newSortFilter.filter[colIndex];
		const sort = newSortFilter.sort[colIndex];

		tr.setNodeMarkup(cellPos, undefined, {
			...cell.attrs,
			filter: filter?.length ? filter : null,
			sort,
		});
	});

	view.dispatch(tr);
};

export default saveSortAndFilter;
