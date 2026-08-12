import type { UserMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useRowSelection } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { useCallback, useState } from "react";

export interface UseUserPickerDialogArgs {
	onPicked: (x: UserMember[]) => void;
}

export const useUserPickerDialog = (args: UseUserPickerDialogArgs) => {
	const { onPicked } = args;

	const { rowSelection, setRowSelection, selectedIds } = useRowSelection();
	const [rowsMap, setRowsMap] = useState(new Map<string, UserMember>());

	const picked = useCallback(async () => {
		onPicked(
			selectedIds
				.map<UserMember>((x) => {
					const saved = rowsMap.get(x);
					return (
						saved ?? {
							value: x,
							isEditor: false,
							isWorkspaceOwner: false,
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
