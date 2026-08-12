import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useRowVersion } from "@ext/enterprise/components/admin/hooks/useRowVersion";
import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { branchesColumn } from "@ext/enterprise/components/admin/settings/members/config/branchesColumn";
import { coverageColumn } from "@ext/enterprise/components/admin/settings/members/config/coverageColumn";
import { roleColumn } from "@ext/enterprise/components/admin/settings/members/config/roleColumn";
import {
	isMixedRole,
	type RoleRules,
	type RoleValue,
	reviewerHasNoBranches,
} from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import t from "@ext/localization/locale/translate";
import { useCallback, useMemo, useState } from "react";

type EntId = string;
type ContId = string;

export interface AddingAccessEntry<TEnt> {
	ent: TEnt;
	role: RoleId;
	branches?: string[];
}

export interface AccessRow<TCont> {
	cont: TCont;
	role: RoleId;
	branches?: string[];
}

export interface BulkAccessRow<TEnt, TCont> {
	ent: TEnt;
	role: RoleValue;
	branches?: string[];
	containers: Map<ContId, AccessRow<TCont>>;
}

const getBranchesRequiredError = () => t("enterprise.admin.resources.branches.required");

interface UseBulkAccessDraftArgs<TEnt, TCont> {
	repoId?: string;
	initial: Map<EntId, BulkAccessRow<TEnt, TCont>>;
	allContainers: TCont[];
	roleRules: RoleRules;
	getEntId: (x: TEnt) => EntId;
	getContId: (x: TCont) => ContId;
	getNames?: (xs: AccessRow<TCont>[]) => string[];
}

export function useBulkAccessDraft<TEnt, TCont>(args: UseBulkAccessDraftArgs<TEnt, TCont>) {
	const { repoId, initial, allContainers, roleRules, getEntId, getContId, getNames } = args;
	const { searchBranches } = useSettings();

	const [bulkRowsMap, setBulkRowsMap] = useState(initial);

	const [branchErrors, setBranchErrors] = useState<Map<string, string>>(new Map());
	const { rowVersions, bumpRowVersion } = useRowVersion<string>();

	const setRole = useCallback(
		(id: EntId, role: RoleId) => {
			setBulkRowsMap((prev) => {
				const prevBulk = prev.get(id);
				if (!prevBulk || prevBulk.role === role) return prev;
				const nextEnt = new Map([...prevBulk.containers.entries()].map(([k, v]) => [k, { ...v, role }]));
				const next = new Map(prev);
				next.set(id, {
					...prevBulk,
					role,
					containers: nextEnt,
				});
				return next;
			});
			bumpRowVersion(id);
		},
		[bumpRowVersion],
	);

	const setBranches = useCallback(
		(id: EntId, branches: string[], role: RoleValue) => {
			setBulkRowsMap((prev) => {
				const prevBulk = prev.get(id);
				if (!prevBulk) return prev;
				const nextEnt = new Map([...prevBulk.containers.entries()].map(([k, v]) => [k, { ...v, branches }]));
				const next = new Map(prev);
				next.set(id, {
					...prevBulk,
					branches,
					containers: nextEnt,
				});
				return next;
			});
			const branchError = role === "reviewer" && !branches.length ? getBranchesRequiredError() : null;
			setBranchErrors((prev) => new Map(prev).set(id, branchError));
			bumpRowVersion(id);
		},
		[bumpRowVersion],
	);

	const remove = useCallback((ids: EntId[]) => {
		setBulkRowsMap((prev) => {
			const next = new Map(prev);
			for (const id of ids) next.delete(id);
			return next;
		});
	}, []);

	const add = useCallback(
		(entries: AddingAccessEntry<TEnt>[]) => {
			setBulkRowsMap((prev) => {
				const next = new Map(prev);
				for (const entry of entries) {
					const { role, branches } = entry;
					const nextEnt = new Map(allContainers.map((x) => [getContId(x), { cont: x, role, branches }]));
					next.set(getEntId(entry.ent), {
						ent: entry.ent,
						role,
						branches,
						containers: nextEnt,
					});
				}
				return next;
			});
		},
		[allContainers, getContId, getEntId],
	);

	const applyToAll = useCallback(
		(rows: BulkAccessRow<TEnt, TCont>[]) => {
			setBulkRowsMap((prev) => {
				const next = new Map(prev);
				for (const row of rows) {
					const role: RoleId = isMixedRole(row.role) ? "reader" : row.role;
					const branches = role === "reviewer" ? row.branches : undefined;
					const nextEnt = new Map(row.containers);
					for (const ent of allContainers) {
						const entId = getContId(ent);
						if (nextEnt.has(entId)) continue;
						nextEnt.set(entId, { cont: ent, role, branches });
					}

					next.set(getEntId(row.ent), { ...row, containers: nextEnt });
				}

				return next;
			});
		},
		[allContainers, getContId, getEntId],
	);

	const columns = useMemo(
		() => [
			roleColumn<BulkAccessRow<TEnt, TCont>>({
				getRules: () => roleRules,
				getValue: (row) => row.role,
				onChange: (row, role) => setRole(getEntId(row.ent), role),
			}),
			branchesColumn<BulkAccessRow<TEnt, TCont>>({
				getValue: (row) => row.branches,
				showPicker: (row) => (row.role === "reviewer" ? (!repoId ? "disabled" : true) : false),
				onChange: (row, branches) => setBranches(getEntId(row.ent), branches, row.role),
				loadBranches: async () => (repoId ? await searchBranches(repoId) : []),
				getError: (row) => branchErrors.get(getEntId(row.ent)),
			}),
			coverageColumn<BulkAccessRow<TEnt, TCont>>({
				getCoverage: (row) => row.containers.size,
				getTotal: () => allContainers.length,
				getNames: (row) => (getNames ? getNames([...row.containers.values()]) : [...row.containers.keys()]),
			}),
		],
		[roleRules, branchErrors, allContainers, setRole, setBranches, searchBranches, getEntId, repoId, getNames],
	);

	const validate = useCallback(() => {
		const errors = new Map<string, string>();
		for (const row of bulkRowsMap.values()) {
			if (reviewerHasNoBranches(row.role, row.branches)) {
				const id = getEntId(row.ent);
				errors.set(id, getBranchesRequiredError());
				bumpRowVersion(id);
			}
		}
		setBranchErrors(errors);
		return !errors.size;
	}, [bulkRowsMap, getEntId, bumpRowVersion]);

	const rows = useMemo(() => [...bulkRowsMap.values()], [bulkRowsMap]);

	return {
		rows,
		rowVersions,
		columns,
		add,
		remove,
		applyToAll,
		validate,
		setRole,
		setBranches,
		branchErrors,
	};
}
