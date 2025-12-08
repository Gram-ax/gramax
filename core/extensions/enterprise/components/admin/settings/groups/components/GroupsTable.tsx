import { useAdminPageData } from "@ext/enterprise/components/admin/contexts/AdminPageDataContext";
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
import { shallow } from "zustand/shallow";

interface GroupsTableProps {
	onDelete: (groupIds: string[]) => Promise<void>;
}

export const GroupsTable = ({ onDelete }: GroupsTableProps) => {
	const { settings } = useSettings();
	const groupSettings = settings?.groups;
	const { setPage, setParams } = useAdminPageData(
		(store) => ({
			setPage: store.setPage,
			setParams: store.setParams,
		}),
		shallow,
	);

	const [groupsRowSelection, setGroupsRowSelection] = useState({});

	const groupsInUse = useMemo(() => {
		return settings?.resources?.flatMap((resource) =>
			Object.values(resource.access).flatMap((access) => (access as any).gxGroups),
		);
	}, [settings]);

	const groups = useMemo(() => {
		if (!groupSettings) return [];
		return Object.entries(groupSettings).map(([name]) => ({
			id: name,
			group: name,
			disabled: groupsInUse?.includes(name),
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
		const groupsToDelete = getSelectedItems().map((group) => group.group);

		if (!groupSettings || !groupsToDelete.length) return;
		await onDelete(groupsToDelete);
		setGroupsRowSelection({});
	}, [getSelectedItems, groupSettings, onDelete]);

	const handleAdd = useCallback(() => {
		setPage(Page.USER_GROUPS);
		setParams({ entityId: "new" });
	}, []);

	const handleEdit = useCallback((groupId: string) => {
		setPage(Page.USER_GROUPS);
		setParams({ entityId: groupId });
	}, []);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			groupsTable.getColumn("group")?.setFilterValue(value);
		},
		[groupsTable],
	);

	return (
		<>
			<TableInfoBlock title={getAdminPageTitle(Page.USER_GROUPS)} description={groups.length} />

			<TableToolbar
				input={
					<TableToolbarTextInput
						placeholder="Найти группы..."
						value={(groupsTable.getColumn("group")?.getFilterValue() as string) ?? ""}
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
				<TriggerAddButtonTemplate key="add-group" startIcon="plus" onClick={handleAdd} />
			</TableToolbar>

			<TableComponent<Group>
				table={groupsTable}
				columns={groupTableColumns}
				onRowClick={(row) => handleEdit(row.original.group)}
			/>
		</>
	);
};
