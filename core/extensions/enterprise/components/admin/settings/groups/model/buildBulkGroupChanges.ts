import { diffGroupAccess } from "@ext/enterprise/components/admin/settings/groups/model/buildGroupChanges";
import type { BulkAccessRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkAccessDraft";
import type { BulkLinkedRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkLinkedDraft";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type {
	GesRepo,
	GroupMember,
	MemberAccess,
	UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { collectBy } from "@ext/enterprise/utils/collectBy";
import { deepEqual } from "@ext/enterprise/utils/deepEqual";

export interface BulkGroupChangesInput {
	groups: GroupMember[];
	origAccess: Map<string, MemberAccess[]>;
	origUser: Map<string, string[]>;
	draftAccess: BulkAccessRow<GesRepo, GroupMember>[];
	draftUser: BulkLinkedRow<UserMember, GroupMember>[];
}

export const buildBulkGroupChanges = (input: BulkGroupChangesInput): AccessChange[] => {
	const { groups, draftAccess, draftUser, origAccess, origUser } = input;
	const changes: AccessChange[] = [];

	const draftAccessByGroup = collectBy(draftAccess, (row) =>
		[...row.containers.entries()].map(([id, c]) => [
			id,
			{ resourceId: row.ent.id, role: c.role, branches: c.branches },
		]),
	);

	const draftUsersByGroup = collectBy(draftUser, (row) =>
		[...row.containers.keys()].map((id) => [id, row.ent.value]),
	);

	for (const g of groups) {
		changes.push(...diffGroupAccess(g.id, g.source, origAccess.get(g.id), draftAccessByGroup.get(g.id)));

		const draft = draftUsersByGroup.get(g.id);
		const orig = origUser.get(g.id);
		if (!deepEqual(orig, draft)) changes.push({ kind: "setGroupUsers", groupId: g.id, emails: draft });
	}

	return changes;
};
