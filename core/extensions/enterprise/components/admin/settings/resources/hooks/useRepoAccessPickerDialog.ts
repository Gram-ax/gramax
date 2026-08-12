import type { MemberAccess } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useRowSelection } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { useCallback, useState } from "react";

export interface UseRepoAccessPickerDialogArgs {
	onPicked: (x: MemberAccess[]) => void;
}

export const useRepoAccessPickerDialog = (args: UseRepoAccessPickerDialogArgs) => {
	const { onPicked } = args;

	const { rowSelection, setRowSelection, selectedIds } = useRowSelection();
	const [rowsMap, setRowsMap] = useState(new Map<string, MemberAccess>());

	const picked = useCallback(async () => {
		onPicked(
			selectedIds
				.map<MemberAccess>((x) => {
					const saved = rowsMap.get(x);
					return (
						saved ?? {
							resourceId: x,
							role: "reader",
						}
					);
				})
				.filter(Boolean),
		);
	}, [rowsMap, selectedIds, onPicked]);

	return {
		selection: rowSelection,
		setSelection: setRowSelection,
		selectedIds,
		rowsMap,
		setRowsMap,
		picked,
	};
};
