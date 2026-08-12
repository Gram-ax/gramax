import type { RowSelectionState } from "@ui-kit/DataTable";
import { useMemo, useState } from "react";

export function useRowSelection() {
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const selectedIds = useMemo(
		() =>
			Object.entries(rowSelection)
				.filter((x) => x[1])
				.map((x) => x[0]),
		[rowSelection],
	);

	const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

	return { rowSelection, setRowSelection, selectedIds, selectedIdsSet };
}

export function useRowSelectionWithData<T>(data: T[], getId: (item: T) => string) {
	const { rowSelection, setRowSelection, selectedIds, selectedIdsSet } = useRowSelection();

	const selectedRows = useMemo(() => data.filter((x) => selectedIdsSet.has(getId(x))), [data, selectedIdsSet, getId]);

	return { rowSelection, setRowSelection, selectedIds, selectedIdsSet, selectedRows };
}
