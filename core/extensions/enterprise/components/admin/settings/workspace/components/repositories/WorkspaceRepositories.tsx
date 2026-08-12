import LfsPatternsEditor from "@core/GitLfs/components/LfsPatternsEditor";
import { repoColumn, repoColumnId } from "@ext/enterprise/components/admin/settings/resources/model/repoColumn";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { SettingsSection } from "@ext/enterprise/components/admin/ui-kit/SettingsSection";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import type { ColumnDef } from "@ui-kit/DataTable";
import { useCallback, useMemo } from "react";
import type { WorkspaceSettings } from "../../types/WorkspaceComponent";
import { RepositoryToolbarAddBtn } from "./components/RepositoriesToolbarAddBtn";

type Repository = {
	id: string;
};

const getRepoRowId = (row: Repository) => row.id;

const repositoriesTableColumns: ColumnDef<Repository>[] = [
	repoColumn({
		getValue: (row) => row.id,
	}),
];

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
	const tableData = useMemo(
		() => localSettings.git.source.repos?.map((repository) => ({ id: repository })) ?? [],
		[localSettings],
	);

	const handleDeleteSelectedRepos = useCallback(
		(rows: Repository[]) => {
			const selectedRepositoryIds = rows.map((row) => row.id);
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
		},
		[setLocalSettings],
	);

	const { rowSelection, setRowSelection, selectedRows } = useRowSelectionWithData(tableData, getRepoRowId);

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
		<SettingsSection
			count={
				<Counter className="font-medium" size="lg" variant="text">
					{localSettings.git.source.repos?.length ?? 0}
				</Counter>
			}
			title={t("enterprise.admin.workspace.repositories.title")}
		>
			<SelectableTable<Repository>
				columns={repositoriesTableColumns}
				data={tableData}
				getRowId={getRepoRowId}
				onRowSelectionChange={setRowSelection}
				rowSelection={rowSelection}
				searchColumnId={repoColumnId}
				searchPlaceholder={t("enterprise.admin.resources.find")}
				toolbarActions={
					<>
						<DeleteSelectedButton
							count={selectedRows.length}
							onClick={() => handleDeleteSelectedRepos(selectedRows)}
						/>
						<RepositoryToolbarAddBtn
							disable={selectResources.length === 0}
							existingRepositories={localSettings.git.source.repos ?? []}
							key="add-repository"
							onAdd={handleAddRepos}
							repositories={selectResources}
						/>
					</>
				}
			/>

			<div className="mt-4">
				<LfsPatternsEditor
					description={t("workspace.lfs-section-description")}
					onChange={handleChange}
					value={patterns}
				/>
			</div>
		</SettingsSection>
	);
}
