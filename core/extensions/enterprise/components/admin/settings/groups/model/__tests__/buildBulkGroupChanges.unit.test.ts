import type { BulkAccessRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkAccessDraft";
import type { BulkLinkedRow } from "@ext/enterprise/components/admin/settings/members/hooks/useBulkLinkedDraft";
import type { GesRepo, GroupMember, UserMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { buildBulkGroupChanges } from "../buildBulkGroupChanges";

const makeGroup = (id: string): GroupMember => ({
	id,
	name: id,
	source: GroupSource.GX_GROUPS,
	isWorkspaceOwner: false,
	isSystem: false,
});

const makeRepo = (id: string): GesRepo => ({
	id,
	isBase: false,
	mainBranch: "main",
	mainBranchProtected: false,
});

const makeUser = (value: string): UserMember => ({
	value,
	isEditor: false,
	isWorkspaceOwner: false,
});

const makeAccessRow = (
	repo: GesRepo,
	group: GroupMember,
	role: "editor" | "reader" | "reviewer",
): BulkAccessRow<GesRepo, GroupMember> => ({
	ent: repo,
	role,
	containers: new Map([[group.id, { cont: group, role }]]),
});

const makeLinkedRow = (user: UserMember, groups: GroupMember[]): BulkLinkedRow<UserMember, GroupMember> => {
	const containers = new Map(groups.map((g): [string, { cont: GroupMember }] => [g.id, { cont: g }]));
	return { ent: user, containers };
};

describe("buildBulkGroupChanges", () => {
	const group = makeGroup("group-1");
	const repo = makeRepo("repo-1");
	const user = makeUser("user@test.com");

	it("returns empty changes when nothing changed", () => {
		const result = buildBulkGroupChanges({
			groups: [group],
			origAccess: new Map(),
			origUser: new Map(),
			draftAccess: [],
			draftUser: [],
		});
		expect(result).toHaveLength(0);
	});

	describe("access changes", () => {
		it("adds setGroupAccess for new access", () => {
			const result = buildBulkGroupChanges({
				groups: [group],
				origAccess: new Map(),
				origUser: new Map(),
				draftAccess: [makeAccessRow(repo, group, "editor")],
				draftUser: [],
			});
			expect(result).toContainEqual({
				kind: "setGroupAccess",
				groupId: "group-1",
				resourceId: "repo-1",
				source: GroupSource.GX_GROUPS,
				role: "editor",
			});
		});

		it("adds removeGroupAccess when access removed", () => {
			const result = buildBulkGroupChanges({
				groups: [group],
				origAccess: new Map([["group-1", [{ resourceId: "repo-1", role: "editor" as const }]]]),
				origUser: new Map(),
				draftAccess: [],
				draftUser: [],
			});
			expect(result).toContainEqual({
				kind: "removeGroupAccess",
				groupId: "group-1",
				source: GroupSource.GX_GROUPS,
				resourceId: "repo-1",
			});
		});

		it("handles multiple groups", () => {
			const group2 = makeGroup("group-2");
			const repo2 = makeRepo("repo-2");
			const result = buildBulkGroupChanges({
				groups: [group, group2],
				origAccess: new Map(),
				origUser: new Map(),
				draftAccess: [makeAccessRow(repo, group, "editor"), makeAccessRow(repo2, group2, "reader")],
				draftUser: [],
			});
			expect(result).toContainEqual({
				kind: "setGroupAccess",
				groupId: "group-1",
				resourceId: "repo-1",
				source: GroupSource.GX_GROUPS,
				role: "editor",
			});
			expect(result).toContainEqual({
				kind: "setGroupAccess",
				groupId: "group-2",
				resourceId: "repo-2",
				source: GroupSource.GX_GROUPS,
				role: "reader",
			});
		});
	});

	describe("user changes", () => {
		it("adds setGroupUsers when users differ", () => {
			const result = buildBulkGroupChanges({
				groups: [group],
				origAccess: new Map(),
				origUser: new Map(),
				draftAccess: [],
				draftUser: [makeLinkedRow(user, [group])],
			});
			expect(result).toContainEqual({
				kind: "setGroupUsers",
				groupId: "group-1",
				emails: ["user@test.com"],
			});
		});

		it("no setGroupUsers when users unchanged", () => {
			const result = buildBulkGroupChanges({
				groups: [group],
				origAccess: new Map(),
				origUser: new Map([["group-1", ["user@test.com"]]]),
				draftAccess: [],
				draftUser: [makeLinkedRow(user, [group])],
			});
			expect(result.filter((c) => c.kind === "setGroupUsers")).toHaveLength(0);
		});
	});

	it("handles empty groups list", () => {
		const result = buildBulkGroupChanges({
			groups: [],
			origAccess: new Map(),
			origUser: new Map(),
			draftAccess: [],
			draftUser: [],
		});
		expect(result).toHaveLength(0);
	});
});
