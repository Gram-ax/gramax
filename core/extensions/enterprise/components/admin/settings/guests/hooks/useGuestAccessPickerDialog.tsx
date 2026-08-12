import type { RepoGuestAccess } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useRowSelection } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { useCallback, useState } from "react";

export interface UseGuestAccessPickerDialogArgs {
	onPicked: (x: RepoGuestAccess[]) => void;
}

export const useGuestAccessPickerDialog = (args: UseGuestAccessPickerDialogArgs) => {
	const { onPicked } = args;

	const { rowSelection, setRowSelection, selectedIds } = useRowSelection();
	const [rowsMap, setRowsMap] = useState(new Map<string, RepoGuestAccess>());

	const picked = useCallback(async () => {
		onPicked(
			selectedIds
				.map<RepoGuestAccess>((x) => {
					const saved = rowsMap.get(x);
					return (
						saved ?? {
							guest: {
								value: x,
							},
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
