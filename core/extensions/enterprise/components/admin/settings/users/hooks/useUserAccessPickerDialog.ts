import type { RepoUserAccess } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useRowSelection } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { useCallback, useState } from "react";

export interface UseUserAccessPickerDialogArgs {
	onPicked: (x: RepoUserAccess[]) => void;
}

export const useUserAccessPickerDialog = (args: UseUserAccessPickerDialogArgs) => {
	const { onPicked } = args;

	const { rowSelection, setRowSelection, selectedIds } = useRowSelection();
	const [rowsMap, setRowsMap] = useState(new Map<string, RepoUserAccess>());

	const picked = useCallback(async () => {
		onPicked(
			selectedIds
				.map<RepoUserAccess>((x) => {
					const saved = rowsMap.get(x);
					return (
						saved ?? {
							user: {
								value: x,
								isEditor: false,
								isWorkspaceOwner: false,
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
