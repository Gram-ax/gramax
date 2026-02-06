import { AccessEntry, RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { UserToolbarAddBtn } from "@ext/enterprise/components/admin/settings/components/UserToolbarAddBtn";
import { useWorkspaceAccess } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceAccess";
import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import { usersTableColumns } from "./config/UserTableConfig";
import { User } from "./types/UserTypes";

interface WorkspaceAccessUserProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
	ownerRole: RoleId;
}

export function WorkspaceAccessUser({ localSettings, setLocalSettings, ownerRole }: WorkspaceAccessUserProps) {
	const { getAccessForRole, handleRoleUpdate } = useWorkspaceAccess(localSettings, setLocalSettings);

	const currentAccess = getAccessForRole(ownerRole);

	const [usersRowSelection, setUsersRowSelection] = useState({});

	const usersTableData = useMemo(
		() => currentAccess.users.map((user) => ({ id: user.value, user: user.value })),
		[currentAccess.users],
	);

	const usersTable = useReactTable({
		data: usersTableData,
		columns: usersTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setUsersRowSelection,
		state: {
			rowSelection: usersRowSelection,
		},
	});

	const usersSelectedCount = useMemo(
		() => usersTable.getFilteredSelectedRowModel().rows.length,
		[usersTable, usersRowSelection],
	);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			usersTable.getColumn("user")?.setFilterValue(value);
		},
		[usersTable],
	);

	const handleAddUsers = useCallback(
		(users: string[]) => {
			if (!localSettings) return;
			const currentAccess = getAccessForRole(ownerRole);

			const usersToAdd = users.map((user) => ({ value: user }));

			if (usersToAdd.length) {
				handleRoleUpdate(ownerRole, {
					users: [...currentAccess.users, ...usersToAdd],
					gxGroups: currentAccess.gxGroups,
				});
			}
		},
		[localSettings, getAccessForRole, handleRoleUpdate, ownerRole],
	);

	const handleDeleteSelectedUsers = useCallback(() => {
		const selectedRows = usersTable.getFilteredSelectedRowModel().rows;
		const selectedUserIds = selectedRows.map((row) => row.original.id);

		setLocalSettings(
			(prev: WorkspaceSettings) =>
				({
					...prev,
					access: {
						...prev.access,
						[ownerRole]: {
							...currentAccess,
							users: currentAccess.users.filter((user) => !selectedUserIds.includes(user.value)),
						} as AccessEntry,
					},
				}) as WorkspaceSettings,
		);
		setUsersRowSelection({});
	}, [setLocalSettings, usersTable, currentAccess, ownerRole]);

	return (
		<div>
			<TableInfoBlock description={currentAccess.users.length} title="Пользователи" />

			<TableToolbar
				input={
					<TableToolbarTextInput
						onChange={handleFilterChange}
						placeholder="Найти пользователей..."
						value={(usersTable.getColumn("user")?.getFilterValue() as string) ?? ""}
					/>
				}
			>
				<AlertDeleteDialog
					hidden={!usersSelectedCount}
					onConfirm={handleDeleteSelectedUsers}
					selectedCount={usersSelectedCount}
				/>
				<UserToolbarAddBtn
					disable={false}
					existingUsers={currentAccess.users.map((user) => user.value)}
					key="add-user"
					onAdd={handleAddUsers}
				/>
			</TableToolbar>

			<TableComponent<User> columns={usersTableColumns} table={usersTable} />
		</div>
	);
}
