import type { BulkAccessRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkAccessDraft";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type {
	GesRepo,
	GroupMember,
	GuestMember,
	RepoAccesses,
	UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import {
	diffGroupAccess,
	diffRepoGuestAccess,
	diffRepoUserAccess,
} from "@ext/enterprise/components/admin/settings/resources/model/buildRepoChanges";
import { collectBy } from "@ext/enterprise/utils/collectBy";

export interface BuildBulkRepoChangesInput {
	repos: GesRepo[];
	origAccesses: Map<string, RepoAccesses>;
	draftGroups: BulkAccessRow<GroupMember, GesRepo>[];
	draftUsers: BulkAccessRow<UserMember, GesRepo>[];
	draftGuests: BulkAccessRow<GuestMember, GesRepo>[];
}

export const buildBulkRepoChanges = (input: BuildBulkRepoChangesInput): AccessChange[] => {
	const { repos, origAccesses, draftGroups, draftUsers, draftGuests } = input;
	const changes: AccessChange[] = [];

	const draftGroupsByRepo = collectBy(draftGroups, (row) =>
		[...row.containers].map(([repoId, c]) => [repoId, { group: row.ent, role: c.role }]),
	);
	const draftUsersByRepo = collectBy(draftUsers, (row) =>
		[...row.containers].map(([repoId, c]) => [repoId, { user: row.ent, role: c.role, branches: c.branches }]),
	);
	const draftGuestsByRepo = collectBy(draftGuests, (row) =>
		[...row.containers].map(([repoId]) => [repoId, { guest: row.ent, role: "reader" as const }]),
	);

	for (const r of repos) {
		const orig = origAccesses.get(r.id);
		changes.push(
			...diffGroupAccess(r.id, orig?.groups ?? [], draftGroupsByRepo.get(r.id) ?? []),
			...diffRepoUserAccess(r.id, orig?.users ?? [], draftUsersByRepo.get(r.id) ?? []),
			...diffRepoGuestAccess(r.id, orig?.guests ?? [], draftGuestsByRepo.get(r.id) ?? []),
		);
	}

	return changes;
};
