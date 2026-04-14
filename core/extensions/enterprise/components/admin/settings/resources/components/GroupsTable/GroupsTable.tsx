import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { GroupAndRoleToolbarAddBtn } from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/GroupToolbarAddBtn";
import groupsTableColumns from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/groupsTableColumns";
import type { ClientAccessGroup } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import {
	type Group,
	GroupSource,
} from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { getGroupsWithNames } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/utils/groupUtils";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable, useTableSelection } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";

interface GroupsTableProps {
	groups: ClientAccessGroup[];
	ssoGroups?: ClientAccessGroup[];
	onChange: (access: { groups: ClientAccessGroup[]; ssoGroups: ClientAccessGroup[] }) => void;
}

const GroupsTable = ({ groups, ssoGroups = [], onChange }: GroupsTableProps) => {
	const [rowSelection, setRowSelection] = useState({});
	const { settings } = useSettings();
	const allGroups = useMemo(() => getGroupsWithNames(settings.groups), [settings.groups]);

	const handleRoleCellChange = useCallback(
		(groupId: string, role: RoleId, source: GroupSource = GroupSource.GX_GROUPS) => {
			const sourceGroups = source === GroupSource.SSO_GROUPS ? ssoGroups : groups;
			const groupIndex = sourceGroups.findIndex((group) => group.id === groupId);
			const group = sourceGroups[groupIndex];
			if (group && group.role !== role) {
				const nextSourceGroups = sourceGroups.map((group, index) => ({
					...group,
					role: index === groupIndex ? role : group.role,
				}));
				onChange({
					groups: source === GroupSource.SSO_GROUPS ? groups : nextSourceGroups,
					ssoGroups: source === GroupSource.SSO_GROUPS ? nextSourceGroups : ssoGroups,
				});
			}
		},
		[groups, onChange, ssoGroups],
	);

	const enrichedGroups = useMemo(() => {
		const localGroups = groups.map((group) => {
			const groupInfo = allGroups.find((g) => g.id === group.id);
			return {
				...group,
				name: groupInfo?.name ?? group.id,
				source: GroupSource.GX_GROUPS,
			};
		});
		const remoteGroups = ssoGroups.map((group) => ({
			...group,
			name: group.name ?? group.id,
			source: GroupSource.SSO_GROUPS,
		}));
		return [...localGroups, ...remoteGroups];
	}, [groups, allGroups, ssoGroups]);

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
			groupsTable.getColumn("name")?.setFilterValue(value);
		},
		[groupsTable],
	);

	const { getSelectedCount, getSelectedItems } = useTableSelection({
		table: groupsTable,
	});

	const selectedGroupsCount = getSelectedCount();

	const handleAddGroups = useCallback(
		(selectedGroups: Group[], role: RoleId) => {
			const newGroups = selectedGroups
				.filter((group) => group.source === GroupSource.GX_GROUPS)
				.map((group) => ({ id: group.id, role }))
				.filter((group) => !groups.some((existingGroup) => existingGroup.id === group.id));
			const newSsoGroups = selectedGroups
				.filter((group) => group.source === GroupSource.SSO_GROUPS)
				.map((group) => ({ id: group.id, role, name: group.name }))
				.filter((group) => !ssoGroups.some((existingGroup) => existingGroup.id === group.id));

			onChange({
				groups: [...groups, ...newGroups],
				ssoGroups: [...ssoGroups, ...newSsoGroups],
			});
		},
		[groups, onChange, ssoGroups],
	);

	const handleDeleteSelected = useCallback(() => {
		const groupsToDelete = getSelectedItems();
		if (!(groups.length || ssoGroups.length) || !groupsToDelete.length) return;

		onChange({
			groups: groups.filter(
				(group) =>
					!groupsToDelete.some(
						(selectedGroup) =>
							selectedGroup.source === GroupSource.GX_GROUPS && selectedGroup.id === group.id,
					),
			),
			ssoGroups: ssoGroups.filter(
				(group) =>
					!groupsToDelete.some(
						(selectedGroup) =>
							selectedGroup.source === GroupSource.SSO_GROUPS && selectedGroup.id === group.id,
					),
			),
		});
		setRowSelection({});
	}, [getSelectedItems, groups, onChange, ssoGroups]);

	return (
		<div>
			<TableToolbar
				input={
					<TableToolbarTextInput
						onChange={handleFilterChange}
						placeholder={t("enterprise.admin.resources.groups.search-placeholder")}
						value={(groupsTable.getColumn("name")?.getFilterValue() as string) ?? ""}
					/>
				}
			>
				<DeleteSelectedButton
					hidden={!selectedGroupsCount}
					onClick={handleDeleteSelected}
					selectedCount={selectedGroupsCount}
				/>
				<GroupAndRoleToolbarAddBtn
					disable={false}
					existingGroups={[...groups.map((group) => group.id), ...ssoGroups.map((group) => group.id)]}
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
