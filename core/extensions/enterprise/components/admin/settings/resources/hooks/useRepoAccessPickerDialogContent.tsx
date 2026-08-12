import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { ChangeRoleButton } from "@ext/enterprise/components/admin/settings/members/components/ChangeRoleButton";
import { branchesColumn } from "@ext/enterprise/components/admin/settings/members/config/branchesColumn";
import { roleColumn } from "@ext/enterprise/components/admin/settings/members/config/roleColumn";
import { useAccessDraft } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessDraft";
import {
	getAccessRowId,
	type MemberAccess,
	type MemberAggregate,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import type { RoleRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { AddRepoSheet } from "@ext/enterprise/components/admin/settings/resources/dialog/AddRepoSheet";
import { repoColumn, repoColumnId } from "@ext/enterprise/components/admin/settings/resources/model/repoColumn";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import type { ColumnDef, RowSelectionState } from "@ui-kit/DataTable";
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

export interface UseRepoAccessPickerDialogContentArgs {
	aggregate: MemberAggregate;
	preselected: Set<string>;
	roleRules: RoleRules;
	selection: RowSelectionState;
	selectedIds: string[];
	rowsMap: Map<string, MemberAccess>;
	setRowsMap: Dispatch<SetStateAction<Map<string, MemberAccess>>>;
	setSelection: Dispatch<SetStateAction<RowSelectionState>>;
}

export const useRepoAccessPickerDialogContent = (args: UseRepoAccessPickerDialogContentArgs) => {
	const { aggregate, preselected, roleRules, selection, selectedIds, rowsMap, setRowsMap, setSelection } = args;
	const { global, searchBranches } = useSettings();

	const [addNewOpen, setAddNewOpen] = useState(false);

	useEffect(() => {
		setRowsMap((prev) => {
			const next = new Map(prev);
			aggregate.repos.forEach((x) => {
				const saved = next.get(x.id);
				if (!saved) {
					next.set(x.id, {
						resourceId: x.id,
						role: "reader",
					});
				}
			});

			return next;
		});
	}, [aggregate.repos, setRowsMap]);

	const rows = useMemo(
		() =>
			aggregate.repos
				.filter((x) => !preselected.has(x.id))
				.map<MemberAccess>((x) => {
					const saved = rowsMap.get(x.id);
					return (
						saved ?? {
							resourceId: x.id,
							role: "reader",
						}
					);
				}),
		[aggregate.repos, preselected, rowsMap],
	);

	const repoCandidates = useMemo(() => {
		const existing = new Set(aggregate.repos.map((x) => x.id));
		return global?.allGitResources?.filter((x) => !existing.has(x));
	}, [aggregate.repos, global?.allGitResources]);

	const access = useAccessDraft({
		rowsMap,
		setRowsMap,
		roleRules,
		getId: getAccessRowId,
	});

	const columns = useMemo<ColumnDef<MemberAccess>[]>(
		() => [
			repoColumn({
				getValue: (row) => row.resourceId,
			}),
			roleColumn({
				getRules: () => roleRules,
				getValue: (row) => row.role,
				onChange: (row, role) => access.setRole([row.resourceId], role),
				isDisabled: (row) => !selection[row.resourceId],
			}),
			branchesColumn({
				getValue: (row) => row.branches,
				showPicker: (row) => row.role === "reviewer",
				onChange: (row, branches) => access.setBranches(row.resourceId, branches, row.role),
				loadBranches: (row) => searchBranches(row.resourceId),
				getError: (row) => access.branchErrors?.get(row.resourceId),
			}),
		],
		[access.branchErrors, access.setBranches, access.setRole, roleRules, searchBranches, selection],
	);

	const createNew = useCallback(
		(id: string) => {
			const newRow: MemberAccess = {
				resourceId: id,
				role: "reader",
			};
			access.add([newRow]);
			setSelection((prev) => ({ ...prev, [id]: true }));
			setRowsMap((prev) => {
				const next = new Map(prev);
				next.set(newRow.resourceId, newRow);
				return next;
			});
		},
		[setSelection, access.add, setRowsMap],
	);

	const bulkRoleChange = useCallback(
		(role: RoleId) => {
			access.setRole(selectedIds, role);
		},
		[access.setRole, selectedIds],
	);

	const headerControls = (
		<>
			<ChangeRoleButton count={selectedIds.length} onChange={bulkRoleChange} rules={roleRules} />
			<Button onClick={() => setAddNewOpen(true)} startIcon="plus" variant="outline">
				{t("enterprise.admin.resources.add")}
			</Button>
			<AddRepoSheet
				onCreate={createNew}
				onOpenChange={setAddNewOpen}
				open={addNewOpen}
				repoCandidates={repoCandidates}
			/>
		</>
	);

	return {
		data: {
			rows: rows,
			rowVersions: access.rowVersions,
			columns,
			getRowId: getAccessRowId,
			searchColumnId: repoColumnId,
			sortable: true,
		},
		headerControls,
	};
};
