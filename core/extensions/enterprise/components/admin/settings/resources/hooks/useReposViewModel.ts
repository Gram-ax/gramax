import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAccessPage } from "@ext/enterprise/components/admin/hooks/useAccessPage";
import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { useSheetSlot } from "@ext/enterprise/components/admin/hooks/useSheetSlot";
import { useAccessSnapshot } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessSnapshot";
import { type GesRepo, getRepoRowId } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { repoColumn, repoColumnId } from "@ext/enterprise/components/admin/settings/resources/model/repoColumn";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { useCallback, useMemo, useState } from "react";

export const useReposViewModel = () => {
	const { global } = useSettings();

	const { isLoading, retry, tabError } = useAccessPage();

	const { aggregate, isLoading: isSnapshotLoading, applyAndSave } = useAccessSnapshot({ enabled: !isLoading });

	const deleteConfirmation = useOpenState();
	const [isDeleting, setIsDeleteing] = useState(false);
	const repoCandidates = useMemo(() => {
		const existing = new Set(aggregate.repos.map((x) => x.id));
		return global?.allGitResources?.filter((x) => !existing.has(x));
	}, [aggregate.repos, global.allGitResources]);

	const bulkSlot = useSheetSlot<GesRepo[]>({ keyBase: "single" });
	const singleSlot = useSheetSlot<GesRepo | null>({ keyBase: "bulk" });

	const { rowSelection, setRowSelection, selectedRows } = useRowSelectionWithData(aggregate.repos, getRepoRowId);

	const selectedHasBase = useMemo(() => selectedRows.some((x) => x.isBase), [selectedRows]);

	const columns = useMemo(
		() => [
			repoColumn<GesRepo>({
				getValue: (row) => row.id,
			}),
		],
		[],
	);

	const openBulkSelected = useCallback(async () => {
		bulkSlot.openWith(selectedRows);
	}, [bulkSlot.openWith, selectedRows]);

	const removeSelected = useCallback(async () => {
		await applyAndSave(
			selectedRows.map((x) => {
				return {
					kind: "removeResource",
					resourceId: x.id,
				};
			}),
		);
		setRowSelection({});
	}, [selectedRows, applyAndSave, setRowSelection]);

	const confirmDelete = useCallback(async () => {
		setIsDeleteing(true);
		try {
			await removeSelected();
			deleteConfirmation.close();
		} finally {
			setIsDeleteing(false);
		}
	}, [removeSelected, deleteConfirmation.close]);

	return {
		data: {
			rows: aggregate.repos,
			getId: getRepoRowId,
			columns,
			candidates: repoCandidates,
			rowSelection,
			setRowSelection,
			selected: selectedRows,
			selectedHasBase,
			searchColumnId: repoColumnId,
			isLoading: isSnapshotLoading,
			delete: {
				...deleteConfirmation,
				isDeleting,
				confirm: confirmDelete,
			},
		},
		form: {
			isLoading,
			tabError,
			retry,
		},
		card: {
			bulk: { ...bulkSlot, openSelected: openBulkSelected },
			single: singleSlot,
		},
		aggregate,
		applyChanges: applyAndSave,
	};
};
