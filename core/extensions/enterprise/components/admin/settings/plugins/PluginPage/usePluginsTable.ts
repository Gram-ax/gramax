import {
	getPluginsTableColumns,
	type PluginTableRow,
} from "@ext/enterprise/components/admin/settings/plugins/PluginPage/PluginsTableConfig";
import type { PluginConfig } from "@plugins/types";
import { getCoreRowModel, getFilteredRowModel, useReactTable, useTableSelection } from "@ui-kit/DataTable";
import { useMemo, useState } from "react";

export type { PluginTableRow };

interface UsePluginsTableProps {
	serverPlugins: PluginConfig[];
	onDelete: (pluginId: string, pluginName: string) => void;
	onToggleState: (pluginId: string, isDisabled: boolean) => void;
}

export const usePluginsTable = ({ serverPlugins, onDelete, onToggleState }: UsePluginsTableProps) => {
	const [rowSelection, setRowSelection] = useState({});

	const columns = useMemo(
		() =>
			getPluginsTableColumns({
				onDelete,
				onToggleState,
			}),
		[onDelete, onToggleState],
	);

	const tableData: PluginTableRow[] = useMemo(
		() =>
			serverPlugins.map((plugin) => ({
				id: plugin.metadata.id,
				name: plugin.metadata.name,
				version: plugin.metadata.version,
				disabled: plugin.metadata.disabled ?? false,
				deleted: false,
				isBuiltIn: plugin.metadata.isBuiltIn ?? false,
				navigateToPage: plugin.metadata.navigateTo,
			})),
		[serverPlugins],
	);

	const table = useReactTable({
		data: tableData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		getRowId: (row) => row.id,
		state: {
			rowSelection,
		},
	});

	const { getSelectedCount, getSelectedItems } = useTableSelection({
		table,
		isRowDisabled: (row) => row.isBuiltIn,
	});

	const resetSelection = () => setRowSelection({});

	return {
		table,
		plugins: serverPlugins,
		getSelectedCount,
		getSelectedItems,
		resetSelection,
	};
};
