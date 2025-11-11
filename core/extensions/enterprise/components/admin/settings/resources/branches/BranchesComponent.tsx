import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable
} from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import { AlertDeleteDialog } from "../../../ui-kit/AlertDeleteDialog";
import { TableComponent } from "../../../ui-kit/table/TableComponent";
import { TableToolbar } from "../../../ui-kit/table/TableToolbar";
import { BranchToolbarAddBtn } from "./components/BranchToolbarAddBtn";
import { branchesTableColumns } from "./config/BranchesTableConfig";
import { Branch } from "./types/BranchesComponentTypes";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";

export type BranchesComponentProps = {
	items: string[];
	onDelete: (branches: string[]) => void;
	onAdd: (branches: string[]) => void;
	selectOptions: string[];
};

export const BranchesComponent = ({ items, onDelete, onAdd, selectOptions }: BranchesComponentProps) => {
	const [rowSelection, setRowSelection] = useState({});

	const tableData = useMemo(() => items.map((branch) => ({ id: branch, branch })), [items]);

	const table = useReactTable({
		data: tableData,
		columns: branchesTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection
		}
	});

	const selectedCount = useMemo(() => table.getFilteredSelectedRowModel().rows.length, [table, rowSelection]);

	const deleteSelected = useCallback(() => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const selectedBranchIds = selectedRows.map((row) => row.original.branch);
		onDelete(selectedBranchIds);
		setRowSelection({});
	}, [onDelete]);

	const handleAddMultipleBranches = useCallback(
		(branches: string[]) => {
			const newBranches = branches.filter((branch) => !items.includes(branch));
			if (newBranches.length > 0) {
				onAdd(newBranches);
			}
		},
		[items, onAdd]
	);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("branch")?.setFilterValue(value);
		},
		[table]
	);

	return (
		<div>
			<TableInfoBlock title="Ветки" description={items.length} />

			<TableToolbar
				input={
					<TableToolbarTextInput
						placeholder="Найти ветки..."
						value={(table.getColumn("branch")?.getFilterValue() as string) ?? ""}
						onChange={handleFilterChange}
					/>
				}
			>
				<AlertDeleteDialog hidden={!selectedCount} onConfirm={deleteSelected} selectedCount={selectedCount} />
				<BranchToolbarAddBtn
					key="add-branch"
					onAdd={handleAddMultipleBranches}
					branches={selectOptions}
					existingBranches={items}
				/>
			</TableToolbar>

			<TableComponent<Branch>
				table={table}
				columns={branchesTableColumns}
			/>
		</div>
	);
};
