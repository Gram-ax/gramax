import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import {
	type Group,
	GroupSource,
} from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import type { searchGroupInfo } from "@ext/enterprise/EnterpriseService";
import { useCache } from "@ui-kit/MultiSelect/utils/useCache";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useCallback, useEffect, useMemo } from "react";

interface UseGroupsParams {
	groups: Group[];
	existingGroups: string[];
}

export type GroupSelectOption = SearchSelectOption & {
	source: GroupSource;
};

export const useGroups = ({ groups, existingGroups }: UseGroupsParams) => {
	const { hasGroups, searchGroups } = useSettings();
	const existingGroupsKey = useMemo(() => [...existingGroups].sort().join("|"), [existingGroups]);

	const existingGroupsSet = useMemo(() => new Set(existingGroups), [existingGroups]);
	const localGroupsById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);

	const mergeGroups = useCallback((localGroups: Group[], remoteGroups: searchGroupInfo[]): Group[] => {
		const mergedGroups = new Map<string, Group>();

		localGroups.forEach((group) => {
			mergedGroups.set(group.id, group);
		});
		remoteGroups.forEach((group) => {
			if (!mergedGroups.has(group.id)) {
				mergedGroups.set(group.id, {
					id: group.id,
					name: group.name,
					source: GroupSource.SSO_GROUPS,
				});
			}
		});

		return Array.from(mergedGroups.values());
	}, []);

	const loadGroupOptions = useCallback(
		async ({ searchQuery }: { searchQuery: string }) => {
			const normalizedSearchQuery = searchQuery.toLowerCase();
			const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(normalizedSearchQuery));
			const remoteGroups = hasGroups ? await searchGroups(searchQuery) : [];
			const mergedGroups = mergeGroups(filteredGroups, remoteGroups);

			return mergedGroups.map<GroupSelectOption>((group) => ({
				value: group.id,
				label: group.name,
				source: group.source,
				disabled: existingGroupsSet.has(group.id),
			}));
		},
		[existingGroupsSet, groups, hasGroups, mergeGroups, searchGroups],
	);

	const { loadOptions, clearCache } = useCache(loadGroupOptions);

	// biome-ignore lint/correctness/useExhaustiveDependencies: clear cache on existing groups change
	useEffect(() => {
		clearCache();
	}, [clearCache, existingGroupsKey]);

	const resolveSelectedGroups = useCallback(
		(options: SearchSelectOption[]): Group[] =>
			options.map((option) => {
				const id = String(option.value);
				const localGroup = localGroupsById.get(id);
				if (localGroup) return localGroup;

				const remoteOption = option as GroupSelectOption;
				return {
					id,
					name: option.label,
					source: remoteOption.source ?? GroupSource.SSO_GROUPS,
				};
			}),
		[localGroupsById],
	);

	return {
		hasGroups,
		loadOptions,
		resolveSelectedGroups,
	};
};
