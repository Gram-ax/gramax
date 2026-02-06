import { GroupToolbarAddBtn } from "@ext/enterprise/components/admin/settings/components/GroupToolbarAddBtn";
import { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { useWorkspaceAccess } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceAccess";
import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import { groupsTableColumns } from "./config/GroupTableConfig";
import { Group, GroupInfo } from "./types/GroupTypes";

interface WorkspaceAccessGroupProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
	ownerRole: RoleId;
	groups: GroupInfo[];
}

export function WorkspaceAccessGroup({
	localSettings,
	setLocalSettings,
	ownerRole,
	groups = [],
}: WorkspaceAccessGroupProps) {
	const { getAccessForRole, handleRoleUpdate } = useWorkspaceAccess(localSettings, setLocalSettings);

	const [groupsRowSelection, setGroupsRowSelection] = useState({});

	const currentAccess = getAccessForRole(ownerRole);

	const groupsTableData = useMemo(() => {
		return currentAccess.gxGroups.map((groupId) => {
			const groupInfo = groups.find((g) => g.id === groupId);
			return { id: groupId, group: groupInfo?.name ?? groupId };
		});
	}, [currentAccess.gxGroups, groups]);

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
		const selectedGroupIds = selectedRows.map((row) => row.original.id);

		setLocalSettings((prev: any) => ({
			...prev,
			access: {
				...prev.access,
				[ownerRole]: {
					...currentAccess,
					gxGroups: currentAccess.gxGroups.filter((group) => !selectedGroupIds.includes(group)),
				},
			},
		}));
		setGroupsRowSelection({});
	}, [setLocalSettings, groupsTable, currentAccess, ownerRole]);

	const groupsSelectedCount = useMemo(
		() => groupsTable.getFilteredSelectedRowModel().rows.length,
		[groupsTable, groupsRowSelection],
	);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			groupsTable.getColumn("group")?.setFilterValue(value);
		},
		[groupsTable],
	);

	const handleAddGroups = useCallback(
		(groups: string[]) => {
			if (!localSettings) return;
			const currentAccess = getAccessForRole(ownerRole);
			handleRoleUpdate(ownerRole, {
				users: currentAccess.users,
				gxGroups: [...currentAccess.gxGroups, ...groups],
			});
		},
		[localSettings, getAccessForRole, handleRoleUpdate, ownerRole],
	);

	return (
		<div>
			<TableInfoBlock
				description={currentAccess.gxGroups.length}
				title={t("enterprise.admin.resources.groups.group")}
			/>

			<TableToolbar
				input={
					<TableToolbarTextInput
						onChange={handleFilterChange}
						placeholder={`${t("enterprise.admin.resources.groups.search-placeholder")}...`}
						value={(groupsTable.getColumn("group")?.getFilterValue() as string) ?? ""}
					/>
				}
			>
				<AlertDeleteDialog
					hidden={!groupsSelectedCount}
					onConfirm={handleDeleteSelectedGroups}
					selectedCount={groupsSelectedCount}
				/>
				<GroupToolbarAddBtn
					disable={groups.length === 0}
					existingGroups={currentAccess.gxGroups}
					groups={groups}
					key="add-group"
					onAdd={handleAddGroups}
				/>
			</TableToolbar>

			<TableComponent<Group> columns={groupsTableColumns} table={groupsTable} />
		</div>
	);
}
