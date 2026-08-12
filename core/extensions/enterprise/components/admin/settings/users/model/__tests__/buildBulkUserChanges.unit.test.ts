import type { BulkAccessRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkAccessDraft";
import type { BulkLinkedRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkLinkedDraft";
import type { GesRepo, GroupMember, UserMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { buildBulkUserChanges } from "../buildBulkUserChanges";

const makeUser = (value: string): UserMember => ({
	value,
	isEditor: false,
	isWorkspaceOwner: false,
});

const makeGroupMember = (id: string): GroupMember => ({
	id,
	name: id,
	source: GroupSource.GX_GROUPS,
	isWorkspaceOwner: false,
	isSystem: false,
});

const makeAccessRow = (
	repo: GesRepo,
	user: UserMember,
	role: "editor" | "reader" | "reviewer",
	branches?: string[],
): BulkAccessRow<GesRepo, UserMember> => ({
	ent: repo,
	role,
	branches,
	containers: new Map([[user.value, { cont: user, role, branches }]]),
});

const makeLinkedRow = (group: GroupMember, users: UserMember[]): BulkLinkedRow<GroupMember, UserMember> => {
	const containers = new Map(users.map((u): [string, { cont: UserMember }] => [u.value, { cont: u }]));
	return { ent: group, containers };
};

describe("buildBulkUserChanges", () => {
	const repo: GesRepo = { id: "repo-1", isBase: false, mainBranch: "main", mainBranchProtected: false };
	const user: UserMember = makeUser("user@test.com");

	it("returns empty changes when nothing changed", () => {
		const result = buildBulkUserChanges({
			users: [user],
			origAccess: new Map(),
			origGroup: new Map(),
			draftAccess: [],
			draftGroup: [],
		});
		expect(result).toHaveLength(0);
	});

	describe("access changes", () => {
		it("adds setUserAccess for new access", () => {
			const result = buildBulkUserChanges({
				users: [user],
				origAccess: new Map(),
				origGroup: new Map(),
				draftAccess: [makeAccessRow(repo, user, "editor")],
				draftGroup: [],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
			});
		});

		it("adds removeUserAccess when access removed", () => {
			const result = buildBulkUserChanges({
				users: [user],
				origAccess: new Map([["user@test.com", [{ resourceId: "repo-1", role: "editor" as const }]]]),
				origGroup: new Map(),
				draftAccess: [],
				draftGroup: [],
			});
			expect(result).toContainEqual({
				kind: "removeUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
			});
		});

		it("handles multiple users with access changes", () => {
			const user2 = makeUser("user2@test.com");
			const result = buildBulkUserChanges({
				users: [user, user2],
				origAccess: new Map(),
				origGroup: new Map(),
				draftAccess: [makeAccessRow(repo, user, "editor"), makeAccessRow(repo, user2, "reader")],
				draftGroup: [],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user2@test.com",
				resourceId: "repo-1",
				role: "reader",
			});
		});
	});

	describe("group changes", () => {
		it("adds setUserGroups when groups differ", () => {
			const group = makeGroupMember("group-1");
			const result = buildBulkUserChanges({
				users: [user],
				origAccess: new Map(),
				origGroup: new Map(),
				draftAccess: [],
				draftGroup: [makeLinkedRow(group, [user])],
			});
			expect(result).toContainEqual({
				kind: "setUserGroups",
				email: "user@test.com",
				groupIds: ["group-1"],
			});
		});

		it("no setUserGroups when groups unchanged", () => {
			const result = buildBulkUserChanges({
				users: [user],
				origAccess: new Map(),
				origGroup: new Map([["user@test.com", ["group-1"]]]),
				draftAccess: [],
				draftGroup: [makeLinkedRow(makeGroupMember("group-1"), [user])],
			});
			expect(result.filter((c) => c.kind === "setUserGroups")).toHaveLength(0);
		});
	});

	it("handles empty users list", () => {
		const result = buildBulkUserChanges({
			users: [],
			origAccess: new Map(),
			origGroup: new Map(),
			draftAccess: [],
			draftGroup: [],
		});
		expect(result).toHaveLength(0);
	});
});
