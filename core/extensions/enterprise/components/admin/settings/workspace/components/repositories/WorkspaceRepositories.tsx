import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import { WorkspaceSettings } from "../../types/WorkspaceComponent";
import { RepositoryToolbarAddBtn } from "./components/RepositoriesToolbarAddBtn";
import { repositoriesTableColumns } from "./config/RepositoriesTableConfig";
import { Repository } from "./types/RepositoriesTypes";

interface WorkspaceRepositoriesProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
	selectResources: string[];
}

export function WorkspaceRepositories({
	localSettings,
	setLocalSettings,
	selectResources,
}: WorkspaceRepositoriesProps) {
	const [rowSelection, setRowSelection] = useState({});

	const tableData = useMemo(
		() => localSettings.source.repos?.map((repository) => ({ id: repository, repository })) ?? [],
		[localSettings],
	);

	const table = useReactTable({
		data: tableData,
		columns: repositoriesTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	const selectedCount = useMemo(() => table.getFilteredSelectedRowModel().rows.length, [table, rowSelection]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("repository")?.setFilterValue(value);
		},
		[table],
	);

	const handleDeleteSelectedRepos = useCallback(() => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const selectedRepositoryIds = selectedRows.map((row: any) => row.original.id);

		setLocalSettings((prev) => ({
			...prev,
			source: {
				...prev.source,
				repos: (prev.source.repos ?? []).filter((repo) => !selectedRepositoryIds.includes(repo)),
			},
		}));
		setRowSelection({});
	}, [table, setLocalSettings]);

	const handleAddRepos = useCallback(
		(repositories: string[]) => {
			setLocalSettings((prev) => ({
				...prev,
				source: {
					...prev.source,
					repos: [...(prev.source.repos ?? []), ...repositories],
				},
			}));
		},
		[setLocalSettings],
	);

	return (
		<div className="py-10">
			<TableInfoBlock title="Базовые репозитории" description={localSettings.source.repos?.length ?? 0} />

			<div>
				<TableToolbar
					input={
						<TableToolbarTextInput
							placeholder="Найти репозитории..."
							value={(table.getColumn("repository")?.getFilterValue() as string) ?? ""}
							onChange={handleFilterChange}
						/>
					}
				>
					<AlertDeleteDialog
						hidden={!selectedCount}
						onConfirm={handleDeleteSelectedRepos}
						selectedCount={selectedCount}
					/>
					<RepositoryToolbarAddBtn
						key="add-repository"
						disable={selectResources.length === 0}
						onAdd={handleAddRepos}
						repositories={selectResources}
						existingRepositories={localSettings.source.repos ?? []}
					/>
				</TableToolbar>

				<TableComponent<Repository> table={table} columns={repositoriesTableColumns} />
			</div>
		</div>
	);
}
