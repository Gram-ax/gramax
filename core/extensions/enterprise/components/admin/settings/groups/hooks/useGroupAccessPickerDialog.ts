import type { RepoGroupAccess } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { useRowSelection } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { useCallback, useState } from "react";

export interface UseGroupAccessPickerDialogArgs {
	onPicked: (x: RepoGroupAccess[]) => void;
}

export const useGroupAccessPickerDialog = (args: UseGroupAccessPickerDialogArgs) => {
	const { onPicked } = args;

	const { rowSelection, setRowSelection, selectedIds } = useRowSelection();
	const [rowsMap, setRowsMap] = useState(new Map<string, RepoGroupAccess>());

	const picked = useCallback(async () => {
		onPicked(
			selectedIds
				.map<RepoGroupAccess>((x) => {
					const saved = rowsMap.get(x);
					return (
						saved ?? {
							group: {
								id: x,
								name: x,
								isSystem: false,
								source: GroupSource.GX_GROUPS,
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
