import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import groupsTableColumns from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/groupsTableColumns";
import { GroupAndRoleToolbarAddBtn } from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/GroupToolbarAddBtn";
import { ClientAccessGroup } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { defaultGroupKeys } from "@ext/enterprise/types/EnterpriseAdmin";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable, useTableSelection } from "@ui-kit/DataTable";
import { useCallback, useState } from "react";

interface GroupsTableProps {
	groups: ClientAccessGroup[];
	onChange: (users: ClientAccessGroup[]) => void;
}

const GroupsTable = ({ groups, onChange }: GroupsTableProps) => {
	const [rowSelection, setRowSelection] = useState({});
	const { settings } = useSettings();
	const allGroups = [...defaultGroupKeys, ...Object.keys(settings.groups)];

	const handleRoleCellChange = useCallback(
		(groupId: string, role: RoleId) => {
			const groupIndex = groups.findIndex((group) => group.id === groupId);
			const group = groups[groupIndex];
			if (group && group.role !== role) {
				const newGroups = groups.map((group, index) => ({
					...group,
					role: index === groupIndex ? role : group.role,
				}));
				onChange(newGroups);
			}
		},
		[groups, onChange],
	);

	const groupsTable = useReactTable({
		data: groups,
		columns: groupsTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		meta: {
			onRoleCellChange: handleRoleCellChange,
		},
		state: { rowSelection },
	});

	const handleFilterChange = useCallback(
		(value: string | null) => {
			groupsTable.getColumn("value")?.setFilterValue(value);
		},
		[groupsTable],
	);

	const { getSelectedCount, getSelectedItems } = useTableSelection({
		table: groupsTable,
	});

	const selectedGroupsCount = getSelectedCount();

	const handleAddGroups = useCallback(
		(newGroups: string[], role: RoleId) => {
			onChange([...groups, ...newGroups.map((group) => ({ id: group, role }))]);
		},
		[groups],
	);

	const handleDeleteSelected = useCallback(() => {
		const groupsToDelete = getSelectedItems().map((user) => user.id);
		if (!groups || !groupsToDelete.length) return;

		const remainingUsers = groups.filter((group) => !groupsToDelete.includes(group.id));
		onChange(remainingUsers);
		setRowSelection({});
	}, [getSelectedItems, groups, onChange]);

	return (
		<div>
			<TableToolbar
				input={
					<TableToolbarTextInput
						placeholder={t("enterprise.admin.resources.users.search-placeholder")}
						value={(groupsTable.getColumn("value")?.getFilterValue() as string) ?? ""}
						onChange={handleFilterChange}
					/>
				}
			>
				<AlertDeleteDialog
					selectedCount={selectedGroupsCount}
					onConfirm={handleDeleteSelected}
					hidden={!selectedGroupsCount}
					description={`${t("enterprise.admin.delete-alert")} ${selectedGroupsCount} ${
						selectedGroupsCount === 1 ? t("record") : t("records")
					}?`}
				/>
				<GroupAndRoleToolbarAddBtn
					key="add-group-role"
					disable={false}
					groups={allGroups}
					onAdd={handleAddGroups}
					existingGroups={groups.map((group) => group.id)}
				/>
			</TableToolbar>
			<TableComponent<ClientAccessGroup> table={groupsTable} columns={groupsTableColumns} />
		</div>
	);
};

export default GroupsTable;
