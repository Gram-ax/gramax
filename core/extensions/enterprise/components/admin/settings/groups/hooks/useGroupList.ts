import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import {
	type QuerySearchFn,
	useQuerySearch,
} from "@ext/enterprise/components/admin/settings/members/hooks/useQuerySearch";
import {
	type GroupMember,
	type MemberAggregate,
	mapSsoToGroupMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import type { searchGroupInfo } from "@ext/enterprise/EnterpriseService";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseGroupListArgs {
	aggregate: MemberAggregate;
	enabled: boolean;
	onGroupsLoad?: (x: GroupMember[]) => void;
}

export const useGroupList = (args: UseGroupListArgs) => {
	const { aggregate, enabled, onGroupsLoad } = args;
	const { ssoGroupsEnabled: ssoEnabled, searchGroups } = useSettings();

	const [query, setQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<"owner" | null>(null);

	const isTypeFilter = typeFilter != null;

	const mapSso = useCallback(
		(sso: searchGroupInfo) => {
			return mapSsoToGroupMember(sso, aggregate.groupsById);
		},
		[aggregate.groupsById],
	);

	const filterPredicate = useCallback(
		(x: GroupMember) => {
			const q = query.toLowerCase();
			return (
				(!query || x.id.toLowerCase().includes(q) || x.name?.toLowerCase().includes(q)) &&
				(typeFilter == null || (typeFilter === "owner" && x.isWorkspaceOwner))
			);
		},
		[query, typeFilter],
	);

	const fetchGroups: QuerySearchFn<GroupMember> = useCallback(
		async (query: string) => {
			const res = await searchGroups(query);
			return res.map(mapSso);
		},
		[searchGroups, mapSso],
	);

	// Has sso, No type filter, has query - sso search
	const { data: searchedSsoGroups, isLoading: searchLoading } = useQuerySearch({
		enabled: enabled && ssoEnabled && !isTypeFilter && Boolean(query),
		searchFn: fetchGroups,
		query,
	});

	const localGroups = useMemo(() => {
		if (!enabled) return [];
		return aggregate.groups.filter(filterPredicate);
	}, [aggregate.groups, filterPredicate, enabled]);

	const groups = useMemo(() => {
		if (!enabled) return [];
		const localIds = new Set(localGroups.map((x) => x.id));
		return [...localGroups, ...searchedSsoGroups.filter((x) => !localIds.has(x.id))];
	}, [localGroups, searchedSsoGroups, enabled]);

	useEffect(() => {
		if (!enabled) return;
		onGroupsLoad?.(groups);
	}, [groups, enabled, onGroupsLoad]);

	return {
		data: {
			groups,
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
