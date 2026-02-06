import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { getCoreRowModel, getFilteredRowModel, useReactTable, useTableSelection } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import { TriggerAddButtonTemplate } from "../../components/TriggerAddButtonTemplate";
import { resourcesTableColumns } from "../config/ResourcesTableConfig";
import { ResourceItem, ResourcesSettings } from "../types/ResourcesComponent";

interface ResourcesTableProps {
	items: ResourcesSettings[] | undefined;
	disabled: boolean;
	onRowClick: (repoId: string | null) => void;
	onDeleteSelected: (selectedIds: string[]) => Promise<void>;
	onAdd: () => void;
}

export function ResourcesTable({ items, disabled, onRowClick, onDeleteSelected, onAdd }: ResourcesTableProps) {
	const { settings } = useSettings();

	const [rowSelection, setRowSelection] = useState({});
	const [loading, setLoading] = useState(false);

	const selectedWorkspaceRepos = useMemo(() => {
		return settings?.workspace?.source.repos ?? [];
	}, [settings]);

	const tableData = useMemo(
		() =>
			items?.map((item) => ({
				id: item.id,
				disabled: selectedWorkspaceRepos.includes(item.id),
			})) || [],
		[items, selectedWorkspaceRepos],
	);

	const table = useReactTable({
		data: tableData,
		columns: resourcesTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	const { getSelectedCount, getSelectedItems } = useTableSelection({
		table,
	});

	const selectedCount = getSelectedCount();

	const handleDeleteSelected = useCallback(async () => {
		const idsToDelete = getSelectedItems().map((row) => row.id);
		setLoading(true);
		await onDeleteSelected(idsToDelete);
		setLoading(false);
		setRowSelection({});
	}, [onDeleteSelected]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("id")?.setFilterValue(value);
		},
		[table],
	);

	return (
		<div>
			<TableInfoBlock description={tableData.length} title={getAdminPageTitle(Page.RESOURCES)} />

			<TableToolbar
				input={
					<TableToolbarTextInput
						onChange={handleFilterChange}
						placeholder="Найти репозитории..."
						value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
					/>
				}
			>
				<AlertDeleteDialog
					hidden={!selectedCount}
					loading={loading}
					onConfirm={handleDeleteSelected}
					selectedCount={selectedCount}
				/>
				<TriggerAddButtonTemplate disabled={disabled} key="add-repo" onClick={onAdd} />
			</TableToolbar>

			<TableComponent<ResourceItem>
				columns={resourcesTableColumns}
				onRowClick={(row) => onRowClick(row.original.id)}
				table={table}
			/>
		</div>
	);
}
