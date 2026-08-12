import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type {
	RepoGroupAccess,
	RepoGuestAccess,
	RepoUserAccess,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { deepEqual } from "@ext/enterprise/utils/deepEqual";

export interface BuildRepoChangesInput {
	isAdd?: boolean;
	repoId: string;
	mainBranch: string | undefined;
	branchProtected: boolean | undefined;
	origMainBranch: string | undefined;
	origBranchProtected: boolean | undefined;
	origGroupAccess: RepoGroupAccess[];
	origUserAccess: RepoUserAccess[];
	origGuestAccess: RepoGuestAccess[];
	draftGroupAccess: RepoGroupAccess[];
	draftUserAccess: RepoUserAccess[];
	draftGuestAccess: RepoGuestAccess[];
}

export const buildRepoChanges = (input: BuildRepoChangesInput): AccessChange[] => {
	const {
		isAdd,
		repoId,
		mainBranch,
		branchProtected,
		origMainBranch,
		origBranchProtected,
		origGroupAccess,
		origUserAccess,
		origGuestAccess,
		draftGroupAccess,
		draftUserAccess,
		draftGuestAccess,
	} = input;

	const changes: AccessChange[] = [];

	if (
		(isAdd && repoId) ||
		(mainBranch ?? "") !== (origMainBranch ?? "") ||
		Boolean(branchProtected) !== Boolean(origBranchProtected)
	)
		changes.push({
			kind: "setResource",
			resourceId: repoId,
			mainBranch: mainBranch,
			branchProtected: branchProtected,
		});

	changes.push(...diffGroupAccess(repoId, origGroupAccess, draftGroupAccess));
	changes.push(...diffRepoUserAccess(repoId, origUserAccess, draftUserAccess));
	changes.push(...diffRepoGuestAccess(repoId, origGuestAccess, draftGuestAccess));

	return changes;
};

export const diffGroupAccess = (
	resourceId: string,
	original: RepoGroupAccess[],
	draft: RepoGroupAccess[],
): AccessChange[] => {
	const changes: AccessChange[] = [];
	const originalMap = new Map(original.map((a) => [a.group.id, a]));
	const draftMap = new Map(draft.map((a) => [a.group.id, a]));

	for (const access of draft) {
		const prev = originalMap.get(access.group.id);
		if (!prev || prev.role !== access.role) {
			changes.push({
				kind: "setGroupAccess",
				groupId: access.group.id,
				resourceId,
				source: access.group.source,
				role: access.role,
			});
		}
	}

	for (const access of original) {
		if (!draftMap.has(access.group.id)) {
			changes.push({
				kind: "removeGroupAccess",
				groupId: access.group.id,
				source: access.group.source,
				resourceId,
			});
		}
	}

	return changes;
};

export const diffRepoUserAccess = (
	resourceId: string,
	original: RepoUserAccess[],
	draft: RepoUserAccess[],
): AccessChange[] => {
	const changes: AccessChange[] = [];
	const originalMap = new Map(original.map((a) => [a.user.value, a]));
	const draftMap = new Map(draft.map((a) => [a.user.value, a]));

	for (const access of draft) {
		const prev = originalMap.get(access.user.value);
		if (!prev || prev.role !== access.role || !deepEqual(prev.branches, access.branches)) {
			changes.push({
				kind: "setUserAccess",
				userId: access.user.value,
				resourceId,
				role: access.role,
				branches: access.branches,
			});
		}
	}

	for (const access of original) {
		if (!draftMap.has(access.user.value)) {
			changes.push({ kind: "removeUserAccess", userId: access.user.value, resourceId });
		}
	}

	return changes;
};

export const diffRepoGuestAccess = (
	resourceId: string,
	original: RepoGuestAccess[],
	draft: RepoGuestAccess[],
): AccessChange[] => {
	const changes: AccessChange[] = [];
	const originalMap = new Map(original.map((a) => [a.guest.value, a]));
	const draftMap = new Map(draft.map((a) => [a.guest.value, a]));

	for (const access of draft) {
		if (!originalMap.has(access.guest.value)) {
			changes.push({ kind: "setGuestAccess", userId: access.guest.value, resourceId });
		}
	}

	for (const access of original) {
		if (!draftMap.has(access.guest.value)) {
			changes.push({ kind: "removeGuestAccess", userId: access.guest.value, resourceId });
		}
	}

	return changes;
};
