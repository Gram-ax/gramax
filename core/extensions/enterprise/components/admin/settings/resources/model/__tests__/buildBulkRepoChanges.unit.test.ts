import type { BulkAccessRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkAccessDraft";
import type {
	GesRepo,
	GroupMember,
	GuestMember,
	RepoAccesses,
	UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { buildBulkRepoChanges } from "../buildBulkRepoChanges";

const makeGroup = (id: string): GroupMember => ({
	id,
	name: id,
	source: GroupSource.GX_GROUPS,
	isWorkspaceOwner: false,
	isSystem: false,
});

const makeUser = (value: string): UserMember => ({
	value,
	isEditor: false,
	isWorkspaceOwner: false,
});

const makeGuest = (value: string): GuestMember => ({ value });

const makeRepo = (id: string): GesRepo => ({
	id,
	isBase: false,
	mainBranch: "main",
	mainBranchProtected: false,
});

const makeGroupAccessRow = (
	group: GroupMember,
	repo: GesRepo,
	role: "editor" | "reader" | "reviewer",
): BulkAccessRow<GroupMember, GesRepo> => ({
	ent: group,
	role,
	containers: new Map([[repo.id, { cont: repo, role }]]),
});

const makeUserAccessRow = (
	user: UserMember,
	repo: GesRepo,
	role: "editor" | "reader" | "reviewer",
	branches?: string[],
): BulkAccessRow<UserMember, GesRepo> => ({
	ent: user,
	role,
	branches,
	containers: new Map([[repo.id, { cont: repo, role, branches }]]),
});

const makeGuestAccessRow = (guest: GuestMember, repo: GesRepo): BulkAccessRow<GuestMember, GesRepo> => ({
	ent: guest,
	role: "reader",
	containers: new Map([[repo.id, { cont: repo, role: "reader" }]]),
});

describe("buildBulkRepoChanges", () => {
	const repo = makeRepo("repo-1");
	const group = makeGroup("group-1");
	const user = makeUser("user@test.com");
	const guest = makeGuest("guest@test.com");

	it("returns empty changes when nothing changed", () => {
		const result = buildBulkRepoChanges({
			repos: [repo],
			origAccesses: new Map(),
			draftGroups: [],
			draftUsers: [],
			draftGuests: [],
		});
		expect(result).toHaveLength(0);
	});

	describe("group access", () => {
		it("adds setGroupAccess for new group", () => {
			const result = buildBulkRepoChanges({
				repos: [repo],
				origAccesses: new Map(),
				draftGroups: [makeGroupAccessRow(group, repo, "editor")],
				draftUsers: [],
				draftGuests: [],
			});
			expect(result).toContainEqual({
				kind: "setGroupAccess",
				groupId: "group-1",
				resourceId: "repo-1",
				source: GroupSource.GX_GROUPS,
				role: "editor",
			});
		});

		it("adds removeGroupAccess when group removed", () => {
			const origAccesses = new Map<string, RepoAccesses>([
				["repo-1", { groups: [{ group, role: "editor" as const }], users: [], guests: [] }],
			]);
			const result = buildBulkRepoChanges({
				repos: [repo],
				origAccesses,
				draftGroups: [],
				draftUsers: [],
				draftGuests: [],
			});
			expect(result).toContainEqual({
				kind: "removeGroupAccess",
				groupId: "group-1",
				source: GroupSource.GX_GROUPS,
				resourceId: "repo-1",
			});
		});
	});

	describe("user access", () => {
		it("adds setUserAccess for new user", () => {
			const result = buildBulkRepoChanges({
				repos: [repo],
				origAccesses: new Map(),
				draftGroups: [],
				draftUsers: [makeUserAccessRow(user, repo, "editor")],
				draftGuests: [],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
			});
		});

		it("adds removeUserAccess when user removed", () => {
			const origAccesses = new Map<string, RepoAccesses>([
				["repo-1", { groups: [], users: [{ user, role: "editor" as const }], guests: [] }],
			]);
			const result = buildBulkRepoChanges({
				repos: [repo],
				origAccesses,
				draftGroups: [],
				draftUsers: [],
				draftGuests: [],
			});
			expect(result).toContainEqual({
				kind: "removeUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
			});
		});
	});

	describe("guest access", () => {
		it("adds setGuestAccess for new guest", () => {
			const result = buildBulkRepoChanges({
				repos: [repo],
				origAccesses: new Map(),
				draftGroups: [],
				draftUsers: [],
				draftGuests: [makeGuestAccessRow(guest, repo)],
			});
			expect(result).toContainEqual({
				kind: "setGuestAccess",
				userId: "guest@test.com",
				resourceId: "repo-1",
			});
		});

		it("adds removeGuestAccess when guest removed", () => {
			const origAccesses = new Map<string, RepoAccesses>([
				["repo-1", { groups: [], users: [], guests: [{ guest, role: "reader" as const }] }],
			]);
			const result = buildBulkRepoChanges({
				repos: [repo],
				origAccesses,
				draftGroups: [],
				draftUsers: [],
				draftGuests: [],
			});
			expect(result).toContainEqual({
				kind: "removeGuestAccess",
				userId: "guest@test.com",
				resourceId: "repo-1",
			});
		});
	});

	it("handles multiple repos", () => {
		const repo2 = makeRepo("repo-2");
		const result = buildBulkRepoChanges({
			repos: [repo, repo2],
			origAccesses: new Map(),
			draftGroups: [makeGroupAccessRow(group, repo, "editor")],
			draftUsers: [makeUserAccessRow(user, repo2, "reader")],
			draftGuests: [makeGuestAccessRow(guest, repo)],
		});
		expect(result).toContainEqual({
			kind: "setGroupAccess",
			groupId: "group-1",
			resourceId: "repo-1",
			source: GroupSource.GX_GROUPS,
			role: "editor",
		});
		expect(result).toContainEqual({
			kind: "setUserAccess",
			userId: "user@test.com",
			resourceId: "repo-2",
			role: "reader",
		});
		expect(result).toContainEqual({ kind: "setGuestAccess", userId: "guest@test.com", resourceId: "repo-1" });
	});

	it("handles empty repos list", () => {
		const result = buildBulkRepoChanges({
			repos: [],
			origAccesses: new Map(),
			draftGroups: [],
			draftUsers: [],
			draftGuests: [],
		});
		expect(result).toHaveLength(0);
	});
});
