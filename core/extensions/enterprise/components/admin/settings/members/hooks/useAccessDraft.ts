import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useRowVersion } from "@ext/enterprise/components/admin/hooks/useRowVersion";
import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { branchesColumn } from "@ext/enterprise/components/admin/settings/members/config/branchesColumn";
import { roleColumn } from "@ext/enterprise/components/admin/settings/members/config/roleColumn";
import {
	type RoleRules,
	reviewerHasNoBranches,
} from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import t from "@ext/localization/locale/translate";
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from "react";

const getBranchesRequiredError = () => t("enterprise.admin.resources.branches.required");

export interface RoleAccessRow {
	role: RoleId;
	branches?: string[];
}

export interface UseAccessDraftArgs<T extends RoleAccessRow> {
	repoId?: string;
	rowsMap: Map<string, T>;
	setRowsMap: Dispatch<SetStateAction<Map<string, T>>>;
	roleRules: RoleRules;
	getId: (row: T) => string;
}

export const useAccessDraft = <T extends RoleAccessRow>(args: UseAccessDraftArgs<T>) => {
	const { repoId, roleRules, rowsMap, setRowsMap, getId } = args;
	const { searchBranches } = useSettings();
	const [branchErrors, setBranchErrors] = useState<Map<string, string>>(new Map());

	const { rowVersions, bumpRowVersion } = useRowVersion<string>();

	const setRole = useCallback(
		(ids: string[], role: RoleId) => {
			setRowsMap((prev) => {
				let next = prev;
				ids.forEach((id) => {
					const existing = prev.get(id);
					if (!existing || existing.role === role) return;
					next = next === prev ? new Map(prev) : next;
					next.set(id, { ...existing, role });
				});

				return next;
			});
			ids.forEach((x) => bumpRowVersion(x));
		},
		[bumpRowVersion, setRowsMap],
	);

	const setBranches = useCallback(
		(id: string, branches: string[], role: RoleId) => {
			setRowsMap((prev) => {
				const existing = prev.get(id);
				if (!existing) return prev;
				const next = new Map(prev);
				next.set(id, { ...existing, branches });
				return next;
			});
			const branchError = role === "reviewer" && !branches.length ? getBranchesRequiredError() : null;
			setBranchErrors((prev) => new Map(prev).set(id, branchError));
			bumpRowVersion(id);
		},
		[bumpRowVersion, setRowsMap],
	);

	const remove = useCallback(
		(entries: T[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				for (const entry of entries) next.delete(getId(entry));
				return next;
			});
			setBranchErrors((prev) => {
				const next = new Map(prev);
				for (const entry of entries) next.delete(getId(entry));
				return next;
			});
		},
		[getId, setRowsMap],
	);

	const add = useCallback(
		(entries: T[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				for (const entry of entries) {
					const id = getId(entry);
					if (entry.role === "reviewer" && !entry.branches?.length) {
						entry.branches = prev.get(id)?.branches;
					}
					next.set(id, entry);
				}
				return next;
			});
		},
		[getId, setRowsMap],
	);

	const columns = useMemo(
		() => [
			roleColumn<T>({
				getRules: () => roleRules,
				getValue: (row) => row.role,
				onChange: (row, role) => setRole([getId(row)], role),
			}),
			branchesColumn<T>({
				getValue: (row) => row.branches,
				showPicker: (row) => row.role === "reviewer",
				onChange: (row, branches) => setBranches(getId(row), branches, row.role),
				loadBranches: async () => (repoId ? await searchBranches(repoId) : []),
				getError: (row) => branchErrors?.get(getId(row)),
			}),
		],
		[roleRules, setRole, setBranches, searchBranches, branchErrors, getId, repoId],
	);

	const validate = useCallback(() => {
		const errors = new Map<string, string>();
		for (const [k, v] of rowsMap.entries()) {
			if (reviewerHasNoBranches(v.role, v.branches)) {
				errors.set(k, getBranchesRequiredError());
				bumpRowVersion(k);
			}
		}
		setBranchErrors(errors);
		return !errors.size;
	}, [rowsMap, bumpRowVersion]);

	return { remove, add, columns, validate, rowVersions, setRole, setBranches, branchErrors };
};
