import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { GroupAndRoleToolbarAddBtn } from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/GroupToolbarAddBtn";
import groupsTableColumns from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/groupsTableColumns";
import { ClientAccessGroup } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { getGroupsWithNames } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/utils/groupUtils";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable, useTableSelection } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";

interface GroupsTableProps {
	groups: ClientAccessGroup[];
	onChange: (users: ClientAccessGroup[]) => void;
}

const GroupsTable = ({ groups, onChange }: GroupsTableProps) => {
	const [rowSelection, setRowSelection] = useState({});
	const { settings } = useSettings();
	const allGroups = useMemo(() => getGroupsWithNames(settings.groups), [settings.groups]);

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

	const enrichedGroups = useMemo(() => {
		return groups.map((group) => {
			const groupInfo = allGroups.find((g) => g.id === group.id);
			return {
				...group,
				name: groupInfo?.name ?? group.id,
			};
		});
	}, [groups, allGroups]);

	const groupsTable = useReactTable({
		data: enrichedGroups,
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
						onChange={handleFilterChange}
						placeholder={t("enterprise.admin.resources.users.search-placeholder")}
						value={(groupsTable.getColumn("value")?.getFilterValue() as string) ?? ""}
					/>
				}
			>
				<AlertDeleteDialog
					description={`${t("enterprise.admin.delete-alert")} ${selectedGroupsCount} ${
						selectedGroupsCount === 1 ? t("record") : t("records")
					}?`}
					hidden={!selectedGroupsCount}
					onConfirm={handleDeleteSelected}
					selectedCount={selectedGroupsCount}
				/>
				<GroupAndRoleToolbarAddBtn
					disable={false}
					existingGroups={groups.map((group) => group.id)}
					groups={allGroups}
					key="add-group-role"
					onAdd={handleAddGroups}
				/>
			</TableToolbar>
			<TableComponent<ClientAccessGroup> columns={groupsTableColumns} table={groupsTable} />
		</div>
	);
};

export default GroupsTable;
