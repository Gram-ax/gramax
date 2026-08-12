import type { BulkAccessRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkAccessDraft";
import type { BulkLinkedRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkLinkedDraft";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type {
	GesRepo,
	GroupMember,
	MemberAccess,
	UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { emailKey } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { diffUserAccess } from "@ext/enterprise/components/admin/settings/users/model/buildUserChanges";
import { collectBy } from "@ext/enterprise/utils/collectBy";
import { deepEqual } from "@ext/enterprise/utils/deepEqual";

export interface BulkUserChangesInput {
	users: UserMember[];
	origAccess: Map<string, MemberAccess[]>;
	origGroup: Map<string, string[]>;
	draftAccess: BulkAccessRow<GesRepo, UserMember>[];
	draftGroup: BulkLinkedRow<GroupMember, UserMember>[];
}

export const buildBulkUserChanges = (input: BulkUserChangesInput): AccessChange[] => {
	const { users, origAccess, draftAccess, origGroup, draftGroup } = input;
	const changes: AccessChange[] = [];

	const draftAccessByUser = collectBy(draftAccess, (row) =>
		[...row.containers.entries()].map(([userId, c]) => [
			userId,
			{ resourceId: row.ent.id, role: c.role, branches: c.branches },
		]),
	);

	const draftGroupsByUser = collectBy(draftGroup, (row) =>
		[...row.containers.keys()].map((userId) => [userId, row.ent.id]),
	);

	for (const u of users) {
		changes.push(...diffUserAccess(u.value, origAccess.get(emailKey(u.value)), draftAccessByUser.get(u.value)));

		const draft = draftGroupsByUser.get(u.value);
		const orig = origGroup.get(emailKey(u.value));
		if (!deepEqual(orig, draft)) changes.push({ kind: "setUserGroups", email: u.value, groupIds: draft });
	}

	return changes;
};
