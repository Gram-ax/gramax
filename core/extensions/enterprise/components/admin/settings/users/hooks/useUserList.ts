import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import {
	type QuerySearchFn,
	useQuerySearch,
} from "@ext/enterprise/components/admin/settings/members/hooks/useQuerySearch";
import {
	emailKey,
	type MemberAggregate,
	mapSsoToUserMember,
	type UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import type { searchUserInfo } from "@ext/enterprise/EnterpriseService";
import { useCallback, useMemo, useState } from "react";

export type FilterTypeOption = "editor" | "owner";

interface UseUsersListArgs {
	aggregate: MemberAggregate;
	enabled: boolean;
	onUsersLoad?: (users: UserMember[]) => void;
}

export const useUserList = (args: UseUsersListArgs) => {
	const { aggregate, enabled, onUsersLoad } = args;
	const { ssoUsersEnabled: ssoEnabled, searchUsers } = useSettings();

	const [query, setQuery] = useState("");

	const [typeFilter, setTypeFilter] = useState<FilterTypeOption | null>(null);

	const isTypeFilter = typeFilter != null;

	const mapSso = useCallback(
		(sso: searchUserInfo) => {
			return mapSsoToUserMember(sso, aggregate.usersByValue);
		},
		[aggregate.usersByValue],
	);

	const fetchUsers: QuerySearchFn<UserMember> = useCallback(
		async (query: string) => {
			const res = await searchUsers(query);
			return res.map(mapSso);
		},
		[searchUsers, mapSso],
	);

	// Has sso, No type filter, has query - sso search
	const isSsoSearch = enabled && ssoEnabled && !isTypeFilter && Boolean(query);

	const { data: searchedUsers, isLoading: searchLoading } = useQuerySearch({
		enabled: isSsoSearch,
		searchFn: fetchUsers,
		onLoad: onUsersLoad,
		query,
	});

	const filterPredicate = useCallback(
		(x: UserMember) => {
			const q = query.toLowerCase();
			return (
				(!query || x.value.toLowerCase().includes(q) || x.name?.toLowerCase().includes(q)) &&
				(typeFilter == null ||
					(typeFilter === "editor" && x.isEditor) ||
					(typeFilter === "owner" && x.isWorkspaceOwner))
			);
		},
		[typeFilter, query],
	);

	// No sso - all local users, has sso - only local users known to sso
	const filteredLocalUsers = useMemo(() => {
		if (!enabled) return [];
		const res = aggregate.users.filter(filterPredicate);
		onUsersLoad?.(res);
		return res;
	}, [aggregate.users, filterPredicate, onUsersLoad, enabled]);

	const users = useMemo(() => {
		if (!isSsoSearch) return filteredLocalUsers;
		const ssoByEmail = new Map(searchedUsers.map((x) => [emailKey(x.value), x]));
		const local = filteredLocalUsers.map((x) => ssoByEmail.get(emailKey(x.value)) ?? x);
		local.forEach((x) => ssoByEmail.delete(emailKey(x.value)));
		return [...local, ...ssoByEmail.values()];
	}, [isSsoSearch, filteredLocalUsers, searchedUsers]);

	return {
		data: {
			users,
			isLoading: searchLoading,
		},
		filter: {
			query: {
				value: query,
				set: setQuery,
			},
			type: {
				selected: typeFilter,
				set: setTypeFilter,
			},
		},
	};
};
