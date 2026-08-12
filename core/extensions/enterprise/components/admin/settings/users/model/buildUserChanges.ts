import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { MemberAccess } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { changedList } from "@ext/enterprise/utils/changedList";
import { deepEqual } from "@ext/enterprise/utils/deepEqual";

export interface BuildUserChangesInput {
	email: string;
	isAdd: boolean;
	isEditor: boolean | undefined;
	wasEditor: boolean | undefined;
	editorsList: string[];
	accesses: MemberAccess[];
	originalAccesses: MemberAccess[];
	groups: string[];
	originalGroups: string[];
	isWorkspaceOwner: boolean;
	wasWorkspaceOwner: boolean;
}

export const buildUserChanges = (input: BuildUserChangesInput): AccessChange[] => {
	const { email, isAdd, isEditor, wasEditor, editorsList } = input;
	const changes: AccessChange[] = [];

	if (isEditor !== wasEditor) {
		const editors = isEditor ? [...new Set([...editorsList, email])] : editorsList.filter((x) => x !== email);
		changes.push({ kind: "setEditorSlots", editors });
	}

	changes.push(...diffUserAccess(email, input.originalAccesses, input.accesses));

	if (changedList(isAdd, input.groups, input.originalGroups))
		changes.push({ kind: "setUserGroups", email: email, groupIds: input.groups });

	if (input.isWorkspaceOwner !== input.wasWorkspaceOwner)
		changes.push({ kind: "setUserWorkspaceOwner", userId: email, owner: input.isWorkspaceOwner });

	return changes;
};

export const diffUserAccess = (
	email: string,
	origArg: MemberAccess[] | undefined,
	draftArg: MemberAccess[] | undefined,
): AccessChange[] => {
	const orig = origArg ?? [];
	const draft = draftArg ?? [];

	const changes: AccessChange[] = [];
	const originalMap = new Map(orig.map((a) => [a.resourceId, a]));
	const draftMap = new Map(draft.map((a) => [a.resourceId, a]));

	for (const access of draft) {
		const prev = originalMap.get(access.resourceId);
		if (!prev || prev.role !== access.role || !deepEqual(prev.branches, access.branches))
			changes.push({
				kind: "setUserAccess",
				userId: email,
				resourceId: access.resourceId,
				role: access.role,
				branches: access.branches,
			});
	}
	for (const access of orig) {
		if (!draftMap.has(access.resourceId))
			changes.push({ kind: "removeUserAccess", userId: email, resourceId: access.resourceId });
	}
	return changes;
};
