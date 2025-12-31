import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { UserAndRoleToolbarAddBtn } from "@ext/enterprise/components/admin/settings/resources/components/UsersTable/UserAndRoleToolbarAddBtn";
import { ClientAccessUser } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable, useTableSelection } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import getUsersTableColumns, { UsersTableColumn } from "./getUsersTableColumns";

interface UsersTableProps {
	repositoryId: string;
	users: ClientAccessUser[];
	onChange: (users: ClientAccessUser[]) => void;
	isExternal?: boolean;
}

const UsersTable = ({ users, onChange, isExternal, repositoryId }: UsersTableProps) => {
	const [rowSelection, setRowSelection] = useState({});
	const { searchBranches } = useSettings();

	const usersTableData: UsersTableColumn[] = useMemo(() => {
		if (isExternal) return users.map((user) => ({ ...user }));
		return users.map((user) => ({ ...user, branches: user.props?.branches ?? [] }));
	}, [users]);

	const loadBranchesOptions = useCallback(async () => {
		if (!searchBranches || !repositoryId) return { options: [] };
		const branches = await searchBranches(repositoryId);
		return { options: branches.map((branch) => ({ value: branch, label: branch, disabled: false })) };
	}, [searchBranches, repositoryId]);

	const handleRoleCellChange = useCallback(
		(userValue: string, role: RoleId) => {
			const userIndex = users.findIndex((user) => user.value === userValue);
			const user = users[userIndex];
			if (user && user.role !== role) {
				if (user.role !== "reviewer") user.props = undefined;
				const newUsers = users.map((user, index) => ({
					...user,
					role: index === userIndex ? role : user.role,
				}));
				onChange(newUsers);
			}
		},
		[users, onChange],
	);

	const handleBranchesCellChange = useCallback(
		(userValue: string, branches: string[]) => {
			const userIndex = users.findIndex((user) => user.value === userValue);
			const user = users[userIndex];
			if (user && user.props?.branches.join(",") !== branches.join(",")) {
				const newUsers = users.map((user, index) => ({
					...user,
					props: index === userIndex ? { ...user.props, branches } : user.props,
				}));
				onChange(newUsers);
			}
		},
		[users, onChange],
	);

	const columns = useMemo(() => getUsersTableColumns(isExternal), [isExternal]);

	const usersTable = useReactTable({
		data: usersTableData,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		meta: {
			onRoleCellChange: handleRoleCellChange,
			onBranchesCellChange: handleBranchesCellChange,
			loadBranchesOptions: loadBranchesOptions,
		},
		state: { rowSelection },
	});

	const handleFilterChange = useCallback(
		(value: string) => {
			usersTable.getColumn("value")?.setFilterValue(value);
		},
		[usersTable],
	);

	const { getSelectedCount, getSelectedItems } = useTableSelection({
		table: usersTable,
	});

	const selectedUsersCount = getSelectedCount();

	const handleAddUsers = useCallback(
		(newUsers: string[], role: RoleId, branches: string[]) => {
			if (branches?.length > 0 && role === "reviewer") {
				onChange([...users, ...newUsers.map((user) => ({ value: user, role, props: { branches } }))]);
			} else {
				onChange([...users, ...newUsers.map((user) => ({ value: user, role }))]);
			}
		},
		[users],
	);

	const handleDeleteSelected = useCallback(() => {
		const usersToDelete = getSelectedItems().map((user) => user.value);
		if (!users || !usersToDelete.length) return;

		const remainingUsers = users.filter((user) => !usersToDelete.includes(user.value));
		onChange(remainingUsers);
		setRowSelection({});
	}, [getSelectedItems, users, onChange]);

	return (
		<div>
			<TableToolbar
				input={
					<TableToolbarTextInput
						placeholder={t("enterprise.admin.resources.users.search-placeholder")}
						value={(usersTable.getColumn("value")?.getFilterValue() as string) ?? ""}
						onChange={handleFilterChange}
					/>
				}
			>
				<AlertDeleteDialog
					selectedCount={selectedUsersCount}
					onConfirm={handleDeleteSelected}
					hidden={!selectedUsersCount}
					description={`${t("enterprise.admin.delete-alert")} ${selectedUsersCount} ${
						selectedUsersCount === 1 ? t("record") : t("records")
					}?`}
				/>
				<UserAndRoleToolbarAddBtn
					key="add-user-role"
					loadBranchesOptions={loadBranchesOptions}
					isExternal={isExternal}
					disable={false}
					onAdd={handleAddUsers}
					existingUsers={users.map((user) => user.value)}
				/>
			</TableToolbar>
			<TableComponent<UsersTableColumn> table={usersTable} columns={columns} />
		</div>
	);
};

export default UsersTable;
