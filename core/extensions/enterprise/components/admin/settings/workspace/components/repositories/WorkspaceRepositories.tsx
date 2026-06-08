import LfsPatternsEditor from "@core/GitLfs/components/LfsPatternsEditor";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";
import type { WorkspaceSettings } from "../../types/WorkspaceComponent";
import { RepositoryToolbarAddBtn } from "./components/RepositoriesToolbarAddBtn";
import { repositoriesTableColumns } from "./config/RepositoriesTableConfig";
import type { Repository } from "./types/RepositoriesTypes";

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
		() => localSettings.git.source.repos?.map((repository) => ({ id: repository, repository })) ?? [],
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: delete button wont appear without this
	const selectedCount = useMemo(() => table.getFilteredSelectedRowModel().rows.length, [table, rowSelection]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("repository")?.setFilterValue(value);
		},
		[table],
	);

	const handleDeleteSelectedRepos = useCallback(() => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const selectedRepositoryIds = selectedRows.map((row) => row.original.id);

		setLocalSettings((prev) => ({
			...prev,
			git: {
				...prev.git,
				source: {
					...prev.git.source,
					repos: (prev.git.source.repos ?? []).filter((repo) => !selectedRepositoryIds.includes(repo)),
				},
			},
		}));
		setRowSelection({});
	}, [table, setLocalSettings]);

	const handleAddRepos = useCallback(
		(repositories: string[]) => {
			setLocalSettings((prev) => ({
				...prev,
				git: {
					...prev.git,
					source: {
						...prev.git.source,
						repos: [...(prev.git.source.repos ?? []), ...repositories],
					},
				},
			}));
		},
		[setLocalSettings],
	);

	const patterns = localSettings.git?.lfs?.patterns ?? [];

	const handleChange = (values: string[]) => {
		setLocalSettings((prev) => ({
			...prev,
			git: { ...prev.git, lfs: { patterns: values } },
		}));
	};

	return (
		<div className="py-10">
			<TableInfoBlock description={localSettings.git.source.repos?.length ?? 0} title="Базовые репозитории" />

			<div>
				<TableToolbar
					input={
						<TableToolbarTextInput
							onChange={handleFilterChange}
							placeholder="Найти репозитории..."
							value={(table.getColumn("repository")?.getFilterValue() as string) ?? ""}
						/>
					}
				>
					<DeleteSelectedButton
						hidden={!selectedCount}
						onClick={handleDeleteSelectedRepos}
						selectedCount={selectedCount}
					/>
					<RepositoryToolbarAddBtn
						disable={selectResources.length === 0}
						existingRepositories={localSettings.git.source.repos ?? []}
						key="add-repository"
						onAdd={handleAddRepos}
						repositories={selectResources}
					/>
				</TableToolbar>

				<TableComponent<Repository> columns={repositoriesTableColumns} table={table} />

				<div className="mt-3">
					<LfsPatternsEditor
						description={t("workspace.lfs-section-description")}
						onChange={handleChange}
						value={patterns}
					/>
				</div>
			</div>
		</div>
	);
}
