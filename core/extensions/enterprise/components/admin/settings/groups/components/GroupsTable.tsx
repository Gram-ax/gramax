import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable, useTableSelection } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import { TriggerAddButtonTemplate } from "../../components/TriggerAddButtonTemplate";
import { groupTableColumns } from "../config/GroupsTableConfig";
import { Group } from "../types/GroupsComponentTypes";

interface GroupsTableProps {
	onDelete: (groupIds: string[]) => Promise<void>;
}

export const GroupsTable = ({ onDelete }: GroupsTableProps) => {
	const { settings } = useSettings();
	const groupSettings = settings?.groups;

	const { navigate } = useAdminNavigation(Page.USER_GROUPS);
	const [groupsRowSelection, setGroupsRowSelection] = useState({});

	const groupsInUse = useMemo(() => {
		return settings?.resources?.flatMap((resource) =>
			Object.values(resource.access).flatMap((access) => (access as any).gxGroups),
		);
	}, [settings]);

	const groups = useMemo(() => {
		if (!groupSettings) return [];
		return Object.entries(groupSettings).map(([groupId, groupData]) => ({
			id: groupId,
			group: groupData.name,
			disabled: groupsInUse?.includes(groupId),
		}));
	}, [groupSettings, groupsInUse]);

	const groupsTable = useReactTable({
		data: groups,
		columns: groupTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setGroupsRowSelection,
		state: {
			rowSelection: groupsRowSelection,
		},
	});

	const { getSelectedCount, getSelectedItems } = useTableSelection({
		table: groupsTable,
	});

	const selectedGroupsCount = getSelectedCount();

	const handleDeleteSelected = useCallback(async () => {
		const groupsToDelete = getSelectedItems().map((group) => group.id);

		if (!groupSettings || !groupsToDelete.length) return;
		await onDelete(groupsToDelete);
		setGroupsRowSelection({});
	}, [getSelectedItems, groupSettings, onDelete]);

	const handleAdd = useCallback(() => {
		navigate(Page.USER_GROUPS, { entityId: "new" });
	}, []);

	const handleEdit = useCallback((groupId: string) => {
		navigate(Page.USER_GROUPS, { entityId: groupId });
	}, []);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			groupsTable.getColumn("group")?.setFilterValue(value);
		},
		[groupsTable],
	);

	return (
		<>
			<TableInfoBlock description={groups.length} title={getAdminPageTitle(Page.USER_GROUPS)} />

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
					description={`${t("enterprise.admin.delete-alert")} ${selectedGroupsCount} ${
						selectedGroupsCount === 1 ? t("record") : t("records")
					}?`}
					hidden={!selectedGroupsCount}
					onConfirm={handleDeleteSelected}
					selectedCount={selectedGroupsCount}
				/>
				<TriggerAddButtonTemplate key="add-group" onClick={handleAdd} startIcon="plus" />
			</TableToolbar>

			<TableComponent<Group>
				columns={groupTableColumns}
				onRowClick={(row) => handleEdit(row.original.id)}
				table={groupsTable}
			/>
		</>
	);
};
