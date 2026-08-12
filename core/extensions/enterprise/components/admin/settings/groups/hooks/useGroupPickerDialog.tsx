import type { GroupMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { useRowSelection } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { useCallback, useState } from "react";

export interface UseGroupPickerDialogArgs {
	onPicked: (x: GroupMember[]) => void;
}

export const useGroupPickerDialog = (args: UseGroupPickerDialogArgs) => {
	const { onPicked } = args;

	const { rowSelection, setRowSelection, selectedIds } = useRowSelection();
	const [rowsMap, setRowsMap] = useState(new Map<string, GroupMember>());

	const picked = useCallback(async () => {
		onPicked(
			selectedIds
				.map<GroupMember>((x) => {
					const saved = rowsMap.get(x);
					return (
						saved ?? {
							id: x,
							name: x,
							source: GroupSource.GX_GROUPS,
							isSystem: false,
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
