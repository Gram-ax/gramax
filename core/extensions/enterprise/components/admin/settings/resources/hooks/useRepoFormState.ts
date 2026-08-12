import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { groupColumn, groupColumnId } from "@ext/enterprise/components/admin/settings/members/config/groupColumn";
import { guestColumn, guestColumnId } from "@ext/enterprise/components/admin/settings/members/config/guestColumn";
import { userColumn, userColumnId } from "@ext/enterprise/components/admin/settings/members/config/userColumn";
import { useAccessDraft } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessDraft";
import {
	type GesRepo,
	getGroupAccessRowId,
	getGuestAccessRowId,
	getUserAccessRowId,
	type MemberAggregate,
	type RepoGroupAccess,
	type RepoGuestAccess,
	type RepoUserAccess,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import {
	useGroupRoleRules,
	useGuestRoleRules,
	useUserRoleRules,
} from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import type { LoadOptionsParams, LoadOptionsResult } from "@ui-kit/AsyncSearchSelect";
import type { ColumnDef } from "@ui-kit/DataTable";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useCallback, useMemo, useState } from "react";

interface UseRepoFormStateArgs {
	repo?: GesRepo;
	repoCandidates: string[];
	aggregate: MemberAggregate;
}

export type RepoFormState = ReturnType<typeof useRepoFormState>;

export const useRepoFormState = (args: UseRepoFormStateArgs) => {
	const { aggregate, repo, repoCandidates } = args;
	const isAdd = !repo;
	const { searchBranches, settings, ssoUsersEnabled } = useSettings();

	const [repoId, setRepoId] = useState<string | undefined>(repo?.id);
	const [branchValue, setBranchValue] = useState<string | undefined>(repo?.mainBranch);
	const [branchProtected, setBranchProtected] = useState<boolean>(repo?.mainBranchProtected ?? false);

	const { roleRules: userRoleRules } = useUserRoleRules();
	const { roleRules: groupRoleRules } = useGroupRoleRules();
	const { roleRules: guestRoleRules } = useGuestRoleRules();

	const repoAccesses = useMemo(
		() => (repo?.id ? aggregate.repoAccesses.get(repo.id) : { groups: [], users: [], guests: [] }),
		[repo?.id, aggregate.repoAccesses],
	);

	const [groupRowsMap, setGroupRowsMap] = useState(() => {
		const res = new Map<string, RepoGroupAccess>();
		repoAccesses.groups.forEach((x) => {
			res.set(x.group.id, x);
		});
		return res;
	});

	const groupAccess = useAccessDraft({
		rowsMap: groupRowsMap,
		setRowsMap: setGroupRowsMap,
		roleRules: groupRoleRules,
		getId: getGroupAccessRowId,
	});

	const groupRows = useMemo(() => [...groupRowsMap.values()], [groupRowsMap]);

	const groupColumns = useMemo<ColumnDef<RepoGroupAccess>[]>(
		() => [
			groupColumn({
				getId: (row) => row.group.id,
				getLabel: (row) => row.group.name,
				getSource: (row) => row.group.source,
			}),
			...groupAccess.columns,
		],
		[groupAccess.columns],
	);

	const [userRowsMap, setUserRowsMap] = useState(() => {
		const res = new Map<string, RepoUserAccess>();
		repoAccesses.users.forEach((x) => {
			res.set(x.user.value, x);
		});
		return res;
	});

	const userAccess = useAccessDraft({
		repoId,
		rowsMap: userRowsMap,
		setRowsMap: setUserRowsMap,
		roleRules: userRoleRules,
		getId: getUserAccessRowId,
	});

	const userRows = useMemo(() => [...userRowsMap.values()], [userRowsMap]);

	const userColumns = useMemo<ColumnDef<RepoUserAccess>[]>(
		() => [
			userColumn({
				getName: (row) => row.user.value,
			}),
			...userAccess.columns,
		],
		[userAccess.columns],
	);

	const [guestRowsMap, setGuestRowsMap] = useState(() => {
		const res = new Map<string, RepoGuestAccess>();
		repoAccesses.guests.forEach((x) => {
			res.set(x.guest.value, x);
		});
		return res;
	});

	const guestAccess = useAccessDraft({
		rowsMap: guestRowsMap,
		setRowsMap: setGuestRowsMap,
		roleRules: guestRoleRules,
		getId: getGuestAccessRowId,
	});

	const guestRows = useMemo(() => [...guestRowsMap.values()], [guestRowsMap]);

	const guestColumns = useMemo<ColumnDef<RepoGuestAccess>[]>(
		() => [
			guestColumn({
				getName: (row) => row.guest.value,
			}),
			...guestAccess.columns,
		],
		[guestAccess.columns],
	);

	const loadRepoOptions = useCallback(
		async ({ searchQuery }: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
			const q = searchQuery.toLowerCase();
			return {
				options: repoCandidates.filter((x) => x.toLowerCase().includes(q)).map((x) => ({ value: x, label: x })),
			};
		},
		[repoCandidates],
	);

	const loadBranchOptions = useCallback(
		async ({ searchQuery }: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
			if (!repoId) return { options: [] };
			try {
				const q = searchQuery.toLowerCase();
				const branches = await searchBranches(repoId);
				return {
					options: branches.filter((x) => x.toLowerCase().includes(q)).map((x) => ({ value: x, label: x })),
				};
			} catch {
				return { options: [] };
			}
		},
		[repoId, searchBranches],
	);

	const handleBranchClear = useCallback(() => {
		setBranchValue(undefined);
		setBranchProtected(false);
	}, []);

	return {
		data: {
			repoId,
			setRepoId,
			branchValue,
			setBranchValue,
			branchProtected,
			setBranchProtected,
			handleBranchClear,
			loadRepoOptions,
			loadBranchOptions,
		},
		userAccess: {
			...userAccess,
			ssoEnabled: ssoUsersEnabled,
			rows: userRows,
			searchColumnId: userColumnId,
			columns: userColumns,
		},
		groupAccess: {
			...groupAccess,
			rows: groupRows,
			searchColumnId: groupColumnId,
			columns: groupColumns,
		},
		guestAccess: {
			...guestAccess,
			rows: guestRows,
			searchColumnId: guestColumnId,
			columns: guestColumns,
			domain: {
				whitelistEnabled: settings?.guests?.whitelistEnabled,
				whitelist: settings?.guests?.domains,
			},
		},
		aggregate,
		isAdd,
	};
};
