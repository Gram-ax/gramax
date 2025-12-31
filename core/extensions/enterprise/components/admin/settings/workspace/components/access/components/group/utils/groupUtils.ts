import { defaultGroupKeys } from "@ext/enterprise/types/EnterpriseAdmin";
import { GroupInfo } from "../types/GroupTypes";

export function getGroupsWithNames(groupsSettings: Record<string, { name: string; members: any[] }> | undefined): GroupInfo[] {
	if (!groupsSettings) return [];

	const customGroups = Object.entries(groupsSettings).map(([id, data]) => ({
		id,
		name: data.name,
	}));

	const defaultGroups = defaultGroupKeys.map(key => ({
		id: key,
		name: key,
	}));

	return [...defaultGroups, ...customGroups];
}

export function getGroupNameById(
	groupId: string,
	groupsSettings: Record<string, { name: string; members: any[] }> | undefined
): string {
	if (defaultGroupKeys.includes(groupId)) return groupId;
	return groupsSettings?.[groupId]?.name ?? groupId;
}
