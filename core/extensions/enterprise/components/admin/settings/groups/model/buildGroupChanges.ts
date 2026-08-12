import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { MemberAccess } from "@ext/enterprise/components/admin/settings/members/model/Member";
import type { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { changedList } from "@ext/enterprise/utils/changedList";

export interface BuildGroupChangesArgs {
	id: string;
	name: string;
	source: GroupSource;
	isAdd: boolean;
	accesses: MemberAccess[];
	originalAccesses: MemberAccess[];
	users: string[];
	originalUsers: string[];
	isWorkspaceOwner: boolean;
	wasWorkspaceOwner: boolean;
}

export const buildGroupChanges = (args: BuildGroupChangesArgs): AccessChange[] => {
	const changes: AccessChange[] = [];

	if (args.isAdd && args.id) changes.push({ kind: "createGroup", groupId: args.id, groupName: args.name });

	changes.push(...diffGroupAccess(args.id, args.source, args.originalAccesses, args.accesses));

	if (changedList(args.isAdd, args.users, args.originalUsers))
		changes.push({ kind: "setGroupUsers", groupId: args.id, emails: args.users });

	if (args.isWorkspaceOwner !== args.wasWorkspaceOwner)
		changes.push({
			kind: "setGroupWorkspaceOwner",
			groupId: args.id,
			source: args.source,
			owner: args.isWorkspaceOwner,
		});

	return changes;
};

export const diffGroupAccess = (
	id: string,
	source: GroupSource,
	origArg: MemberAccess[] | undefined,
	draftArg: MemberAccess[] | undefined,
): AccessChange[] => {
	const changes: AccessChange[] = [];
	const original = origArg ?? [];
	const draft = draftArg ?? [];
	const originalMap = new Map(original.map((a) => [a.resourceId, a]));
	const draftMap = new Map(draft.map((a) => [a.resourceId, a]));

	for (const access of draft) {
		const prev = originalMap.get(access.resourceId);
		if (!prev || prev.role !== access.role)
			changes.push({
				kind: "setGroupAccess",
				groupId: id,
				resourceId: access.resourceId,
				source: source,
				role: access.role,
			});
	}
	for (const access of original) {
		if (!draftMap.has(access.resourceId))
			changes.push({ kind: "removeGroupAccess", groupId: id, source, resourceId: access.resourceId });
	}
	return changes;
};
