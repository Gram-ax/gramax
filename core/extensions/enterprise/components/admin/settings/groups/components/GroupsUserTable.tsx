import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import { GroupValue } from "../../components/roles/Access";
import { UserToolbarAddBtn } from "../../components/UserToolbarAddBtn";
import { groupUserTableColumns } from "../config/GroupsUserTableConfig";
import { GroupUser } from "../types/GroupsUserComponentTypes";

interface GroupsUserTableProps {
	users: GroupValue[];
	onChange: (users: GroupValue[]) => void;
}

export const GroupsUserTable = ({ users, onChange }: GroupsUserTableProps) => {
	const [userRowSelection, setUserRowSelection] = useState({});

	const usersData = useMemo(() => {
		return users.map((user) => ({
			id: user.value,
			value: user.value,
		}));
	}, [users]);

	const usersTable = useReactTable({
		data: usersData,
		columns: groupUserTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setUserRowSelection,
		state: {
			rowSelection: userRowSelection,
		},
	});

	const handleAddUsers = useCallback(
		(newUsers: string[]) => {
			const usersToAdd = newUsers.map((user) => ({ value: user }));

			if (usersToAdd.length) {
				onChange([...users, ...usersToAdd]);
			}
		},
		[users, onChange],
	);

	const handleDeleteSelectedUsers = useCallback(() => {
		const selectedRows = usersTable.getFilteredSelectedRowModel().rows;
		const usersToDelete = selectedRows.map((row) => row.original.value);

		onChange(users.filter((user) => !usersToDelete.includes(user.value)));
		setUserRowSelection({});
	}, [usersTable, users, onChange]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			usersTable.getColumn("value")?.setFilterValue(value);
		},
		[usersTable],
	);

	const selectedUsersCount = useMemo(
		() => usersTable.getFilteredSelectedRowModel().rows.length,
		[usersTable, userRowSelection],
	);

	return (
		<>
			<label className="text-primary-fg flex h-4 min-w-0 items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
				<span>{t("enterprise.admin.users.users")}</span>
				<span>{users.length}</span>
			</label>

			<TableToolbar
				input={
					<TableToolbarTextInput
						onChange={handleFilterChange}
						placeholder={t("enterprise.admin.resources.users.search-placeholder")}
						value={(usersTable.getColumn("value")?.getFilterValue() as string) ?? ""}
					/>
				}
			>
				<AlertDeleteDialog
					hidden={!selectedUsersCount}
					onConfirm={handleDeleteSelectedUsers}
					selectedCount={selectedUsersCount}
				/>

				<UserToolbarAddBtn
					existingUsers={users.map((user) => user.value)}
					key="add-user"
					onAdd={handleAddUsers}
				/>
			</TableToolbar>

			<TableComponent<GroupUser> columns={groupUserTableColumns} table={usersTable} />
		</>
	);
};
