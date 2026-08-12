import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import type { searchGroupInfo, searchUserInfo } from "@ext/enterprise/EnterpriseService";
import { type AccessSnapshot, applyAccessChanges } from "../applyAccessChanges";
import { buildMemberAggregate, emptyAggregate } from "../buildMemberAggregate";

const emptySearchUsers = async (_: string[]): Promise<searchUserInfo[]> => [];
const emptySearchGroups = async (_: string[]): Promise<searchGroupInfo[]> => [];

const emptyDraft = (): AccessSnapshot => ({
	resources: [],
	groups: {},
	workspace: baseWorkspace,
});

const baseWorkspace = {
	name: "ws",
	sections: {},
	git: { source: { url: "https://example.com", type: "GitLab" as const, repos: ["repo-1"] } },
	wordTemplates: [],
	pdfTemplates: [],
};

describe("buildMemberAggregate", () => {
	it("returns empty aggregate for empty draft", async () => {
		const result = await buildMemberAggregate({
			draft: emptyDraft(),
			searchUsersByEmails: emptySearchUsers,
			searchGroupsByIds: emptySearchGroups,
		});

		expect(result.repos).toHaveLength(0);
		expect(result.users).toHaveLength(0);
		expect(result.groups).toHaveLength(2);
		expect(result.guests).toHaveLength(0);
		expect(result.editors).toHaveLength(0);
		expect(result.editorsCount).toBe(0);
	});

	describe("resources and repos", () => {
		it("builds repos from resources", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{
					kind: "setResource",
					resourceId: "repo-1",
					mainBranch: "main",
					branchProtected: true,
				},
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.repos).toHaveLength(1);
			expect(result.repos[0].id).toBe("repo-1");
			expect(result.repos[0].mainBranch).toBe("main");
			expect(result.repos[0].mainBranchProtected).toBe(true);
			expect(result.repoById.get("repo-1")).toBeDefined();
		});

		it("marks repo as base when it is in workspace git source repos", async () => {
			const draft: AccessSnapshot = {
				resources: [],
				groups: {},
				workspace: { ...baseWorkspace, git: { source: { url: "", type: "GitLab", repos: ["repo-1"] } } },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.repos[0].isBase).toBe(true);
		});

		it("does not mark repo as base when not in workspace git source repos", async () => {
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(emptyDraft(), [
					{ kind: "setResource", resourceId: "repo-2", mainBranch: "main", branchProtected: false },
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.repos[0].isBase).toBe(false);
		});
	});

	describe("users", () => {
		it("builds users from resource access", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "editor" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.users).toHaveLength(1);
			expect(result.users[0].value).toBe("user@test.com");
			expect(result.users[0].isEditor).toBe(false);
			expect(result.usersByValue.get("user@test.com")).toBeDefined();
		});

		it("marks users as editors when they are in the editor list", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				editors: { count: 2, editors: ["editor@test.com"] },
			};
			const searchUsers = async (emails: string[]): Promise<searchUserInfo[]> =>
				emails.map((email) => ({ email, name: email }));
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
					{ kind: "setUserAccess", userId: "editor@test.com", resourceId: "repo-1", role: "editor" },
				]),
				searchUsersByEmails: searchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const editor = result.users.find((u) => u.value === "editor@test.com");
			expect(editor?.isEditor).toBe(true);
			expect(result.editors).toHaveLength(1);
		});

		it("marks users as editors when searchUsersByEmails is undefined", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				editors: { count: 2, editors: ["editor@test.com"] },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
					{ kind: "setUserAccess", userId: "editor@test.com", resourceId: "repo-1", role: "editor" },
					{ kind: "setUserAccess", userId: "regular@test.com", resourceId: "repo-1", role: "reader" },
				]),
				searchUsersByEmails: undefined,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.editors).toHaveLength(1);
			expect(result.editors[0].value).toBe("editor@test.com");
		});

		it("merges emails differing only by case into the last granted access", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setUserAccess", userId: "User@Test.com", resourceId: "repo-1", role: "editor" },
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "reader" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.users).toEqual([{ value: "user@test.com", isEditor: false, isWorkspaceOwner: false }]);
			expect(result.userAccesses.get("user@test.com")).toEqual([
				{ resourceId: "repo-1", role: "reader", branches: undefined },
			]);
		});

		it("keeps repo access rows for users with uppercase emails", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setUserAccess", userId: "Ivan@corp.ru", resourceId: "repo-1", role: "editor" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.repoAccesses.get("repo-1").users).toHaveLength(1);
			expect(result.repoAccesses.get("repo-1").users[0].user.value).toBe("Ivan@corp.ru");
		});

		it("does not duplicate a user when SSO returns a different email casing", async () => {
			const searchUsers = async (): Promise<searchUserInfo[]> => [{ email: "IVAN@corp.ru", name: "Ivan" }];
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setUserAccess", userId: "ivan@corp.ru", resourceId: "repo-1", role: "editor" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: searchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.users).toHaveLength(1);
			expect(result.users[0].name).toBe("Ivan");
		});

		it("enriches users with SSO info", async () => {
			const searchUsers = async (): Promise<searchUserInfo[]> => [{ email: "user@test.com", name: "Test User" }];
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "editor" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: searchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.users[0].name).toBe("Test User");
			expect(result.users[0].isSso).toBe(true);
		});
	});

	describe("guests", () => {
		it("builds guests from externalUsers access", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setGuestAccess", userId: "guest@test.com", resourceId: "repo-1" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.guests).toHaveLength(1);
			expect(result.guests[0].value).toBe("guest@test.com");
			expect(result.guestsByValue.get("guest@test.com")).toBeDefined();
		});
	});

	describe("groups", () => {
		it("builds groups from group access on resources", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				groups: { "group-1": { name: "My Group", members: [] } },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
					{
						kind: "setGroupAccess",
						groupId: "group-1",
						source: GroupSource.GX_GROUPS,
						resourceId: "repo-1",
						role: "editor",
					},
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.groups.length).toBeGreaterThanOrEqual(1);
			expect(result.groupsById.get("group-1")?.name).toBe("My Group");
		});

		it("groups from groupsSettings get names from groupsSettings", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				groups: { "custom-group": { name: "Custom", members: [] } },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
					{
						kind: "setGroupAccess",
						groupId: "custom-group",
						source: GroupSource.GX_GROUPS,
						resourceId: "repo-1",
						role: "editor",
					},
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const group = result.groupsById.get("custom-group");
			expect(group?.name).toBe("Custom");
		});

		it("enriches groups with SSO info", async () => {
			const searchGroups = async (): Promise<searchGroupInfo[]> => [{ id: "group-1", name: "SSO Group Name" }];
			const draft: AccessSnapshot = {
				...emptyDraft(),
				groups: { "group-1": { name: "Original", members: [] } },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{
						kind: "setGroupAccess",
						groupId: "group-1",
						source: GroupSource.GX_GROUPS,
						resourceId: "repo-1",
						role: "editor",
					},
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: searchGroups,
			});

			const group = result.groupsById.get("group-1");
			expect(group?.name).toBe("SSO Group Name");
		});

		it("keeps groupsSettings names when searchGroupsByIds is undefined", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				groups: { "group-1": { name: "Original", members: [] } },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{
						kind: "setGroupAccess",
						groupId: "group-1",
						source: GroupSource.GX_GROUPS,
						resourceId: "repo-1",
						role: "editor",
					},
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: undefined,
			});

			const group = result.groupsById.get("group-1");
			expect(group?.name).toBe("Original");
		});
	});

	describe("repo accesses", () => {
		it("maps group accesses per repo", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				groups: { "group-1": { name: "G1", members: [] } },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
					{
						kind: "setGroupAccess",
						groupId: "group-1",
						source: GroupSource.GX_GROUPS,
						resourceId: "repo-1",
						role: "editor",
					},
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const repoAccess = result.repoAccesses.get("repo-1");
			expect(repoAccess).toBeDefined();
			expect(repoAccess?.groups).toHaveLength(1);
			expect(repoAccess?.groups[0].group.id).toBe("group-1");
			expect(repoAccess?.groups[0].role).toBe("editor");
		});

		it("maps user accesses per repo", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "reviewer" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const repoAccess = result.repoAccesses.get("repo-1");
			expect(repoAccess?.users).toHaveLength(1);
			expect(repoAccess?.users[0].user.value).toBe("user@test.com");
			expect(repoAccess?.users[0].role).toBe("reviewer");
		});

		it("maps guest accesses per repo", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setGuestAccess", userId: "guest@test.com", resourceId: "repo-1" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const repoAccess = result.repoAccesses.get("repo-1");
			expect(repoAccess?.guests).toHaveLength(1);
			expect(repoAccess?.guests[0].guest.value).toBe("guest@test.com");
			expect(repoAccess?.guests[0].role).toBe("reader");
		});
	});

	describe("group-user links", () => {
		it("builds groupToUsers and userToGroups maps", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				groups: {
					"group-1": { name: "G1", members: [{ value: "user@test.com" }] },
				},
			};
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.groupToUsers.get("group-1")).toEqual(["user@test.com"]);
			expect(result.userToGroups.get("user@test.com")).toEqual(["group-1"]);
		});

		it("ensures users from group links appear in users list", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				groups: {
					"group-1": { name: "G1", members: [{ value: "member@test.com" }] },
				},
			};
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.users.some((u) => u.value === "member@test.com")).toBe(true);
		});
	});

	describe("editors", () => {
		it("editors list contains only users with isEditor flag", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				editors: { count: 3, editors: ["editor@test.com"] },
			};
			const searchUsers = async (emails: string[]): Promise<searchUserInfo[]> =>
				emails.map((email) => ({ email, name: email }));
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
					{ kind: "setUserAccess", userId: "editor@test.com", resourceId: "repo-1", role: "editor" },
					{ kind: "setUserAccess", userId: "regular@test.com", resourceId: "repo-1", role: "reader" },
				]),
				searchUsersByEmails: searchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.editors).toHaveLength(1);
			expect(result.editors[0].value).toBe("editor@test.com");
			expect(result.editorsCount).toBe(3);
		});

		it("editors list without SSO uses all users with isEditor", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				editors: { count: 2, editors: ["editor@test.com"] },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
					{ kind: "setUserAccess", userId: "editor@test.com", resourceId: "repo-1", role: "editor" },
					{ kind: "setUserAccess", userId: "regular@test.com", resourceId: "repo-1", role: "reader" },
				]),
				searchUsersByEmails: undefined,
				searchGroupsByIds: emptySearchGroups,
			});

			expect(result.editors).toHaveLength(1);
			expect(result.editors[0].value).toBe("editor@test.com");
			expect(result.editorsCount).toBe(2);
		});
	});

	describe("workspace owners", () => {
		it("marks users as workspace owners", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setUserAccess", userId: "owner@test.com", resourceId: "repo-1", role: "editor" },
			]);
			const withOwner = applyAccessChanges(draft, [
				{ kind: "setUserWorkspaceOwner", userId: "owner@test.com", owner: true },
			]);
			const result = await buildMemberAggregate({
				draft: withOwner,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const owner = result.users.find((u) => u.value === "owner@test.com");
			expect(owner?.isWorkspaceOwner).toBe(true);
		});

		it("marks groups as workspace owners", async () => {
			const draft: AccessSnapshot = {
				resources: [],
				groups: { "group-1": { name: "G1", members: [] } },
				workspace: {
					...baseWorkspace,
					access: { workspaceOwner: { gxGroups: ["group-1"], users: [] } },
				},
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const group = result.groupsById.get("group-1");
			expect(group?.isWorkspaceOwner).toBe(true);
		});
	});

	describe("member accesses maps", () => {
		it("groupAccesses maps group id to accesses", async () => {
			const draft: AccessSnapshot = {
				...emptyDraft(),
				groups: { "group-1": { name: "G1", members: [] } },
			};
			const result = await buildMemberAggregate({
				draft: applyAccessChanges(draft, [
					{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
					{ kind: "setResource", resourceId: "repo-2", mainBranch: "main", branchProtected: false },
					{
						kind: "setGroupAccess",
						groupId: "group-1",
						source: GroupSource.GX_GROUPS,
						resourceId: "repo-1",
						role: "editor",
					},
					{
						kind: "setGroupAccess",
						groupId: "group-1",
						source: GroupSource.GX_GROUPS,
						resourceId: "repo-2",
						role: "reader",
					},
				]),
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const accesses = result.groupAccesses.get("group-1");
			expect(accesses).toHaveLength(2);
			expect(accesses?.map((a) => a.resourceId).sort()).toEqual(["repo-1", "repo-2"]);
		});

		it("userAccesses maps user value to accesses", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "editor" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const accesses = result.userAccesses.get("user@test.com");
			expect(accesses).toHaveLength(1);
			expect(accesses?.[0].resourceId).toBe("repo-1");
			expect(accesses?.[0].role).toBe("editor");
		});

		it("guestAccesses maps guest value to accesses", async () => {
			const draft = applyAccessChanges(emptyDraft(), [
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: false },
				{ kind: "setGuestAccess", userId: "guest@test.com", resourceId: "repo-1" },
			]);
			const result = await buildMemberAggregate({
				draft,
				searchUsersByEmails: emptySearchUsers,
				searchGroupsByIds: emptySearchGroups,
			});

			const accesses = result.guestAccesses.get("guest@test.com");
			expect(accesses).toHaveLength(1);
			expect(accesses?.[0].resourceId).toBe("repo-1");
		});
	});

	it("emptyAggregate returns structure with all expected fields", () => {
		const aggregate = emptyAggregate();
		expect(aggregate.repos).toEqual([]);
		expect(aggregate.groups).toEqual([]);
		expect(aggregate.users).toEqual([]);
		expect(aggregate.guests).toEqual([]);
		expect(aggregate.editors).toEqual([]);
		expect(aggregate.editorsCount).toBe(0);
		expect(aggregate.groupAccesses).toBeInstanceOf(Map);
		expect(aggregate.userAccesses).toBeInstanceOf(Map);
		expect(aggregate.guestAccesses).toBeInstanceOf(Map);
		expect(aggregate.repoAccesses).toBeInstanceOf(Map);
		expect(aggregate.repoById).toBeInstanceOf(Map);
		expect(aggregate.groupsById).toBeInstanceOf(Map);
		expect(aggregate.usersByValue).toBeInstanceOf(Map);
		expect(aggregate.guestsByValue).toBeInstanceOf(Map);
		expect(aggregate.groupToUsers).toBeInstanceOf(Map);
		expect(aggregate.userToGroups).toBeInstanceOf(Map);
	});
});
