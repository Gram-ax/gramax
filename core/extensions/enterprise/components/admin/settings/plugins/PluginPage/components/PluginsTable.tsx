import { cn } from "@core-ui/utils/cn";
import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { StyledTableWrapper } from "@ext/enterprise/components/admin/settings/plugins/PluginPage/PluginsComponent.style";
import {
	columnClassName,
	type PluginTableRow,
} from "@ext/enterprise/components/admin/settings/plugins/PluginPage/PluginsTableConfig";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { flexRender, type Table } from "@ui-kit/DataTable";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "ics-ui-kit/components/table";

interface PluginsTableProps {
	table: Table<PluginTableRow>;
}

export const PluginsTable = ({ table }: PluginsTableProps) => {
	const { navigate } = useAdminNavigation(Page.PLUGIN_DETAIL);

	return (
		<div className="overflow-hidden rounded-md border border-solid border-[color:var(--color-merge-request-border)]">
			<StyledTableWrapper>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id} className="border-b">
							{headerGroup.headers.map((header) => (
								<TableHead
									key={header.id}
									className={columnClassName[header.column.id as keyof typeof columnClassName]}
								>
									{flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.map((row) => (
						<PluginTableRowComponent key={row.id} row={row} navigate={navigate} />
					))}
				</TableBody>
			</StyledTableWrapper>
		</div>
	);
};

interface PluginTableRowComponentProps {
	row: ReturnType<Table<PluginTableRow>["getRowModel"]>["rows"][number];
	navigate: ReturnType<typeof useAdminNavigation>["navigate"];
}

const PluginTableRowComponent = ({ row, navigate }: PluginTableRowComponentProps) => {
	const handleRowClick = () => {
		if (row.original.deleted) return;
		if (row.original.isBuiltIn && row.original.navigateToPage) {
			navigate(row.original.navigateToPage as Parameters<typeof navigate>[0]);
		} else {
			navigate(Page.PLUGIN_DETAIL, { selectedPluginId: row.original.id });
		}
	};

	return (
		<TableRow
			data-state={row.getIsSelected() && "selected"}
			className={cn(
				"border-b",
				row.original.deleted && "deleted-row",
				!row.original.deleted && row.original.disabled && "disabled-row",
			)}
			onClick={handleRowClick}
		>
			{row.getVisibleCells().map((cell) => (
				<TableCell key={cell.id} className={columnClassName[cell.column.id as keyof typeof columnClassName]}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</TableCell>
			))}
		</TableRow>
	);
};
