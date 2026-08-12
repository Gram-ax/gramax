import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAccessPage } from "@ext/enterprise/components/admin/hooks/useAccessPage";
import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { useSheetSlot } from "@ext/enterprise/components/admin/hooks/useSheetSlot";
import { useGroupList } from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupList";
import { groupBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/groupBadgesColumn";
import { groupColumn } from "@ext/enterprise/components/admin/settings/members/config/groupColumn";
import { useAccessSnapshot } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessSnapshot";
import { type GroupMember, getGroupRowId } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { useRowSelection } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import type { ColumnDef } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";

export const useGroupsViewModel = () => {
	const { ssoGroupsEnabled } = useSettings();
	const { isLoading, retry, tabError } = useAccessPage();

	const { aggregate, isLoading: isSnapshotLoading, applyAndSave } = useAccessSnapshot({ enabled: !isLoading });

	const deleteConfirmation = useOpenState();
	const [isDeleting, setIsDeleteing] = useState(false);
	const { rowSelection, setRowSelection, selectedIds } = useRowSelection();

	const singleSlot = useSheetSlot<GroupMember | null>({ keyBase: "single" });
	const bulkSlot = useSheetSlot<GroupMember[]>({ keyBase: "bulk" });

	const [rowsMap, setRowsMap] = useState<Map<string, GroupMember>>(new Map());

	const onGroupsLoad = useCallback((groups: GroupMember[]) => {
		setRowsMap((prev) => {
			const next = new Map(prev);
			groups.forEach((x) => next.set(x.id, x));
			return next;
		});
	}, []);

	const groupList = useGroupList({ aggregate, onGroupsLoad, enabled: !isSnapshotLoading });

	const groupsColumns = useMemo<ColumnDef<GroupMember>[]>(
		() => [
			groupColumn({
				getLabel: (row) => row.name,
				getId: (row) => row.id,
			}),
			groupBadgesColumn({
				getId: (row) => row.id,
				getSource: (row) => row.source,
				isWorkspaceOwner: (row) => row.isWorkspaceOwner,
			}),
		],
		[],
	);

	const openBulkSelected = useCallback(() => {
		const groups = selectedIds.map((x) => rowsMap.get(x)).filter(Boolean);
		bulkSlot.openWith(groups);
	}, [selectedIds, rowsMap, bulkSlot.openWith]);

	const deleteDisabled = useMemo(() => {
		const groups = selectedIds.map((x) => rowsMap.get(x)).filter(Boolean);
		return groups.some((x) => x.isSystem || x.source === GroupSource.SSO_GROUPS);
	}, [selectedIds, rowsMap]);

	const removeSelected = useCallback(async () => {
		await applyAndSave([{ kind: "deleteGroups", groupIds: selectedIds }]);
		setRowSelection({});
	}, [selectedIds, setRowSelection, applyAndSave]);

	const confirmDelete = useCallback(async () => {
		setIsDeleteing(true);
		try {
			await removeSelected();
			deleteConfirmation.close();
		} finally {
			setIsDeleteing(false);
		}
	}, [removeSelected, deleteConfirmation.close]);

	return {
		data: {
			rows: groupList.data.groups,
			getId: getGroupRowId,
			columns: groupsColumns,
			selection: rowSelection,
			setSelection: setRowSelection,
			selected: selectedIds,
			isLoading: groupList.data.isLoading || isSnapshotLoading,
			filter: groupList.filter,
			delete: {
				...deleteConfirmation,
				disabled: deleteDisabled,
				isDeleting,
				confirm: confirmDelete,
			},
			ssoEnabled: ssoGroupsEnabled,
		},
		card: {
			bulk: { ...bulkSlot, openSelected: openBulkSelected },
			single: singleSlot,
		},
		form: {
			isLoading,
			tabError,
			retry,
		},
		aggregate,
		applyChanges: applyAndSave,
	};
};
