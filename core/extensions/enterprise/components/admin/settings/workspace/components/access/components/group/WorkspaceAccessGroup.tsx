import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { GroupToolbarAddBtn } from "@ext/enterprise/components/admin/settings/components/GroupToolbarAddBtn";
import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { useWorkspaceAccess } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceAccess";
import type { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import { groupsTableColumns } from "./config/GroupTableConfig";
import { type Group, GroupSource } from "./types/GroupTypes";

interface WorkspaceAccessGroupProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
	ownerRole: RoleId;
	groups: Group[];
}

export function WorkspaceAccessGroup({
	localSettings,
	setLocalSettings,
	ownerRole,
	groups = [],
}: WorkspaceAccessGroupProps) {
	const { getAccessForRole, handleRoleUpdate } = useWorkspaceAccess(localSettings, setLocalSettings);
	const { hasGroups } = useSettings();

	const [groupsRowSelection, setGroupsRowSelection] = useState({});

	const currentAccess = getAccessForRole(ownerRole);

	const groupsTableData = useMemo(() => {
		const localGroups = currentAccess.gxGroups.map((groupId) => {
			const groupInfo = groups.find((g) => g.id === groupId);
			return {
				id: groupId,
				name: groupInfo?.name ?? groupId,
				source: GroupSource.GX_GROUPS,
			};
		});
		const ssoGroups = (currentAccess.ssoGroups ?? []).map((group) => ({
			id: group,
			name: group,
			source: GroupSource.SSO_GROUPS,
		}));
		return [...localGroups, ...ssoGroups];
	}, [currentAccess.gxGroups, currentAccess.ssoGroups, groups]);

	const groupsTable = useReactTable({
		data: groupsTableData,
		columns: groupsTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setGroupsRowSelection,
		state: {
			rowSelection: groupsRowSelection,
		},
	});

	const handleDeleteSelectedGroups = useCallback(() => {
		const selectedRows = groupsTable.getFilteredSelectedRowModel().rows;
		const selectedGroups = selectedRows.map((row) => row.original);

		setLocalSettings((prev: WorkspaceSettings) => ({
			...prev,
			access: {
				...prev.access,
				[ownerRole]: {
					...currentAccess,
					gxGroups: currentAccess.gxGroups.filter(
						(group) =>
							!selectedGroups.some(
								(selectedGroup) =>
									selectedGroup.source === GroupSource.GX_GROUPS && selectedGroup.id === group,
							),
					),
					ssoGroups: (currentAccess.ssoGroups ?? []).filter(
						(group) =>
							!selectedGroups.some(
								(selectedGroup) =>
									selectedGroup.source === GroupSource.SSO_GROUPS && selectedGroup.id === group,
							),
					),
				},
			},
		}));
		setGroupsRowSelection({});
	}, [setLocalSettings, groupsTable, currentAccess, ownerRole]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: recount selected groups count when row selection changes
	const groupsSelectedCount = useMemo(
		() => groupsTable.getFilteredSelectedRowModel().rows.length,
		[groupsTable, groupsRowSelection],
	);

	const existingGroupIds = useMemo(
		() => [...currentAccess.gxGroups, ...(currentAccess.ssoGroups ?? [])],
		[currentAccess.gxGroups, currentAccess.ssoGroups],
	);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			groupsTable.getColumn("name")?.setFilterValue(value);
		},
		[groupsTable],
	);

	const handleAddGroups = useCallback(
		(selectedGroups: Group[]) => {
			if (!localSettings) return;
			const currentAccess = getAccessForRole(ownerRole);
			const newGxGroups = selectedGroups
				.filter((group) => group.source === GroupSource.GX_GROUPS)
				.map((group) => group.id)
				.filter((groupId) => !currentAccess.gxGroups.includes(groupId));
			const newSsoGroups = selectedGroups
				.filter((group) => group.source === GroupSource.SSO_GROUPS)
				.map((group) => group.id)
				.filter((groupId) => !(currentAccess.ssoGroups ?? []).includes(groupId));

			handleRoleUpdate(ownerRole, {
				users: currentAccess.users,
				gxGroups: [...currentAccess.gxGroups, ...newGxGroups],
				ssoGroups: [...(currentAccess.ssoGroups ?? []), ...newSsoGroups],
			});
		},
		[localSettings, getAccessForRole, handleRoleUpdate, ownerRole],
	);

	return (
		<div>
			<TableInfoBlock description={groupsTableData.length} title={t("enterprise.admin.resources.groups.group")} />

			<TableToolbar
				input={
					<TableToolbarTextInput
						onChange={handleFilterChange}
						placeholder={`${t("enterprise.admin.resources.groups.search-placeholder")}...`}
						value={(groupsTable.getColumn("name")?.getFilterValue() as string) ?? ""}
					/>
				}
			>
				<DeleteSelectedButton
					hidden={!groupsSelectedCount}
					onClick={handleDeleteSelectedGroups}
					selectedCount={groupsSelectedCount}
				/>
				<GroupToolbarAddBtn
					disable={!hasGroups && groups.length === 0}
					existingGroups={existingGroupIds}
					groups={groups}
					key="add-group"
					onAdd={handleAddGroups}
				/>
			</TableToolbar>

			<TableComponent<Group> columns={groupsTableColumns} table={groupsTable} />
		</div>
	);
}
