import type { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import { defaultGroupKeys } from "@ext/enterprise/types/EnterpriseAdmin";
import t from "@ext/localization/locale/translate";
import { type Group, GroupSource } from "../types/GroupTypes";

export type GroupBadgeType = "system" | "custom" | "sso";

export function getGroupBadgeType(group: Pick<Group, "id" | "source">): GroupBadgeType {
	if (group.source === GroupSource.SSO_GROUPS) return "sso";
	return defaultGroupKeys.includes(group.id) ? "system" : "custom";
}

export function getGroupSourceLabel(group: Pick<Group, "id" | "source">): string {
	return {
		sso: t("enterprise.admin.groups.badges.sso"),
		custom: t("group"),
		system: t("enterprise.admin.groups.badges.system"),
	}[getGroupBadgeType(group)];
}

export function getGroupsWithNames(groupsSettings: GroupsSettings): Group[] {
	if (!groupsSettings) return [];

	const customGroups = Object.entries(groupsSettings).map(
		([id, data]): Group => ({
			id,
			name: data.name,
			source: GroupSource.GX_GROUPS,
		}),
	);

	const defaultGroups = defaultGroupKeys.map(
		(key): Group => ({
			id: key,
			source: GroupSource.GX_GROUPS,
		}),
	);

	return [...defaultGroups, ...customGroups];
}

export function getGroupDisplayNameById(groupId: string, groupsSettings: GroupsSettings | undefined): string {
	if (defaultGroupKeys.includes(groupId)) return groupId;
	return groupsSettings?.[groupId]?.name ?? groupId;
}
