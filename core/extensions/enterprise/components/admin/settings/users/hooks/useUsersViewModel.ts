import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAccessPage } from "@ext/enterprise/components/admin/hooks/useAccessPage";
import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { useSheetSlot } from "@ext/enterprise/components/admin/hooks/useSheetSlot";
import { nameColumn } from "@ext/enterprise/components/admin/settings/members/config/nameColumn";
import { userBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/userBadgesColumn";
import { userColumn } from "@ext/enterprise/components/admin/settings/members/config/userColumn";
import { useAccessSnapshot } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessSnapshot";
import { getUserRowId, type UserMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useUserList } from "@ext/enterprise/components/admin/settings/users/hooks/useUserList";
import { useRowSelection } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";

export const useUsersViewModel = () => {
	const { ssoUsersEnabled } = useSettings();
	const { isLoading, retry, tabError } = useAccessPage();

	const { aggregate, isLoading: isSnapshotLoading, applyAndSave } = useAccessSnapshot({ enabled: !isLoading });

	const deleteConfirmation = useOpenState();
	const [isDeleting, setIsDeleteing] = useState(false);
	const { rowSelection, selectedIds, setRowSelection } = useRowSelection();

	const singleSlot = useSheetSlot<UserMember | null>({ keyBase: "single" });
	const bulkSlot = useSheetSlot<UserMember[]>({ keyBase: "bulk" });

	const [rowsMap, setRowsMap] = useState<Map<string, UserMember>>(new Map());

	const onUsersLoad = useCallback((users: UserMember[]) => {
		setRowsMap((prev) => {
			const next = new Map(prev);
			users.forEach((x) => next.set(x.value, x));
			return next;
		});
	}, []);

	const userList = useUserList({
		aggregate,
		onUsersLoad,
		enabled: !isSnapshotLoading,
	});

	const userColumns = useMemo<ColumnDef<UserMember>[]>(
		() => [
			userColumn({
				header: t("email"),
				getName: (row) => row.value,
				isEditor: (row) => row.isEditor,
				isWorkspaceOwner: (row) => row.isWorkspaceOwner,
			}),
			...(ssoUsersEnabled
				? [
						nameColumn<UserMember>({
							getName: (row) => row.name,
						}),
					]
				: []),
			userBadgesColumn({
				isEditor: (row) => row.isEditor,
				isWorkspaceOwner: (row) => row.isWorkspaceOwner,
			}),
		],
		[ssoUsersEnabled],
	);

	const openBulkSelected = useCallback(() => {
		const users = selectedIds.map((x) => rowsMap.get(x)).filter(Boolean);
		bulkSlot.openWith(users);
	}, [selectedIds, rowsMap, bulkSlot.openWith]);

	const removeSelected = useCallback(async () => {
		await applyAndSave(
			selectedIds.map((x) => ({
				kind: "removeUserEverywhere",
				userId: x,
			})),
		);
		setRowSelection({});
	}, [selectedIds, applyAndSave, setRowSelection]);

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
			rows: userList.data.users,
			getId: getUserRowId,
			columns: userColumns,
			selection: rowSelection,
			setSelection: setRowSelection,
			selected: selectedIds,
			isLoading: userList.data.isLoading || isSnapshotLoading,
			filter: userList.filter,
			delete: {
				...deleteConfirmation,
				isDeleting,
				confirm: confirmDelete,
			},
			ssoEnabled: ssoUsersEnabled,
		},
		card: {
			bulk: {
				...bulkSlot,
				openSelected: openBulkSelected,
			},
			single: singleSlot,
		},
		form: {
			isLoading: isLoading || isSnapshotLoading,
			tabError,
			retry,
		},
		aggregate,
		applyChanges: applyAndSave,
		occupiedEditors: aggregate.editors.length,
		totalEditors: aggregate.editorsCount,
	};
};
