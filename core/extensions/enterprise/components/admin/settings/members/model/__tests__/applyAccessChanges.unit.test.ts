import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import type { AccessChange } from "../AccessChange";
import { type AccessSnapshot, applyAccessChanges } from "../applyAccessChanges";

const emptySnapshot = (): AccessSnapshot => ({
	resources: [],
	groups: {},
});

const snapshotWithResource = (): AccessSnapshot => ({
	resources: [
		{
			id: "repo-1",
			mainBranch: "main",
			mainBranchProtected: true,
			access: {
				users: [],
				groups: [],
				externalUsers: [],
				ssoGroups: [],
			},
		},
	],
	groups: {},
});

describe("applyAccessChanges", () => {
	it("returns snapshot unchanged when changes array is empty", () => {
		const snapshot = snapshotWithResource();
		const result = applyAccessChanges(snapshot, []);
		expect(result).toEqual(snapshot);
	});

	describe("removeResource", () => {
		it("removes resource by id", () => {
			const snapshot = snapshotWithResource();
			const changes: AccessChange[] = [{ kind: "removeResource", resourceId: "repo-1" }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources).toHaveLength(0);
		});

		it("does nothing if resource id does not exist", () => {
			const snapshot = snapshotWithResource();
			const changes: AccessChange[] = [{ kind: "removeResource", resourceId: "nonexistent" }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources).toHaveLength(1);
		});
	});

	describe("setResource", () => {
		it("updates mainBranch and mainBranchProtected on existing resource", () => {
			const snapshot = snapshotWithResource();
			const changes: AccessChange[] = [
				{
					kind: "setResource",
					resourceId: "repo-1",
					mainBranch: "develop",
					branchProtected: false,
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].mainBranch).toBe("develop");
			expect(result.resources[0].mainBranchProtected).toBe(false);
		});

		it("creates resource if it does not exist", () => {
			const snapshot = emptySnapshot();
			const changes: AccessChange[] = [
				{
					kind: "setResource",
					resourceId: "new-repo",
					mainBranch: "main",
					branchProtected: true,
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources).toHaveLength(1);
			expect(result.resources[0].id).toBe("new-repo");
			expect(result.resources[0].mainBranch).toBe("main");
			expect(result.resources[0].mainBranchProtected).toBe(true);
		});
	});

	describe("setGroupAccess", () => {
		it("adds gx group access to resource", () => {
			const snapshot = snapshotWithResource();
			const changes: AccessChange[] = [
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					source: GroupSource.GX_GROUPS,
					resourceId: "repo-1",
					role: "editor",
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.groups).toEqual([
				{ id: "group-1", role: "editor", source: GroupSource.GX_GROUPS },
			]);
		});

		it("adds sso group access to resource", () => {
			const snapshot = snapshotWithResource();
			const changes: AccessChange[] = [
				{
					kind: "setGroupAccess",
					groupId: "sso-group-1",
					source: GroupSource.SSO_GROUPS,
					resourceId: "repo-1",
					role: "reader",
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.ssoGroups).toEqual([
				{ id: "sso-group-1", role: "reader", source: GroupSource.SSO_GROUPS },
			]);
		});

		it("upserts existing group access instead of duplicating", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [],
							groups: [{ id: "group-1", role: "reader", source: GroupSource.GX_GROUPS }],
							externalUsers: [],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					source: GroupSource.GX_GROUPS,
					resourceId: "repo-1",
					role: "editor",
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.groups).toHaveLength(1);
			expect(result.resources[0].access.groups[0].role).toBe("editor");
		});
	});

	describe("removeGroupAccess", () => {
		it("removes group access from resource", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [],
							groups: [{ id: "group-1", role: "editor", source: GroupSource.GX_GROUPS }],
							externalUsers: [],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{
					kind: "removeGroupAccess",
					groupId: "group-1",
					source: GroupSource.GX_GROUPS,
					resourceId: "repo-1",
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.groups).toHaveLength(0);
		});

		it("removes sso group access from resource", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [],
							groups: [{ id: "group-1", role: "editor", source: GroupSource.GX_GROUPS }],
							externalUsers: [],
							ssoGroups: [{ id: "sso-group-1", role: "reader", source: GroupSource.SSO_GROUPS }],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{
					kind: "removeGroupAccess",
					groupId: "sso-group-1",
					source: GroupSource.SSO_GROUPS,
					resourceId: "repo-1",
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.ssoGroups).toHaveLength(0);
			expect(result.resources[0].access.groups).toHaveLength(1);
		});
	});

	describe("setUserAccess", () => {
		it("adds user access to resource", () => {
			const snapshot = snapshotWithResource();
			const changes: AccessChange[] = [
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "editor" },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.users).toEqual([
				{ value: "user@test.com", role: "editor", props: undefined },
			]);
		});

		it("adds user access with branches", () => {
			const snapshot = snapshotWithResource();
			const changes: AccessChange[] = [
				{
					kind: "setUserAccess",
					userId: "user@test.com",
					resourceId: "repo-1",
					role: "editor",
					branches: ["feature/*"],
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.users[0].props).toEqual({ branches: ["feature/*"] });
		});

		it("upserts existing user access", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [{ value: "user@test.com", role: "reader" }],
							groups: [],
							externalUsers: [],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "editor" },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.users).toHaveLength(1);
			expect(result.resources[0].access.users[0].role).toBe("editor");
		});
	});

	describe("removeUserAccess", () => {
		it("removes user access from resource", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [{ value: "user@test.com", role: "editor" }],
							groups: [],
							externalUsers: [],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{ kind: "removeUserAccess", userId: "user@test.com", resourceId: "repo-1" },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.users).toHaveLength(0);
		});
	});

	describe("createGroup", () => {
		it("creates a new group if it does not exist", () => {
			const snapshot = emptySnapshot();
			const changes: AccessChange[] = [{ kind: "createGroup", groupId: "group-1", groupName: "My Group" }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.groups).toEqual({ "group-1": { name: "My Group", members: [] } });
		});

		it("does not overwrite an existing group", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: { "group-1": { name: "Original", members: [{ value: "u@test.com" }] } },
			};
			const changes: AccessChange[] = [{ kind: "createGroup", groupId: "group-1", groupName: "New Name" }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.groups["group-1"].name).toBe("Original");
		});
	});

	describe("deleteGroups", () => {
		it("deletes groups by ids", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: {
					"group-1": { name: "G1", members: [] },
					"group-2": { name: "G2", members: [] },
				},
			};
			const changes: AccessChange[] = [{ kind: "deleteGroups", groupIds: ["group-1"] }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.groups).toEqual({ "group-2": { name: "G2", members: [] } });
		});

		it("silently ignores nonexistent group ids", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: { "group-1": { name: "G1", members: [] } },
			};
			const changes: AccessChange[] = [{ kind: "deleteGroups", groupIds: ["nonexistent"] }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.groups).toEqual({ "group-1": { name: "G1", members: [] } });
		});
	});

	describe("setGroupUsers", () => {
		it("sets members for a group", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: { "group-1": { name: "G1", members: [] } },
			};
			const changes: AccessChange[] = [
				{ kind: "setGroupUsers", groupId: "group-1", emails: ["a@test.com", "b@test.com"] },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.groups["group-1"].members).toEqual([{ value: "a@test.com" }, { value: "b@test.com" }]);
		});

		it("does nothing if group does not exist", () => {
			const snapshot = emptySnapshot();
			const changes: AccessChange[] = [{ kind: "setGroupUsers", groupId: "nonexistent", emails: ["a@test.com"] }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.groups).toEqual({});
		});
	});

	describe("setUserGroups", () => {
		it("adds user to specified groups and removes from others", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: {
					"group-1": { name: "G1", members: [{ value: "u@test.com" }] },
					"group-2": { name: "G2", members: [{ value: "u@test.com" }] },
					"group-3": { name: "G3", members: [] },
				},
			};
			const changes: AccessChange[] = [
				{ kind: "setUserGroups", email: "u@test.com", groupIds: ["group-1", "group-3"] },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.groups["group-1"].members).toEqual([{ value: "u@test.com" }]);
			expect(result.groups["group-2"].members).toEqual([]);
			expect(result.groups["group-3"].members).toEqual([{ value: "u@test.com" }]);
		});
	});

	describe("setEditorSlots", () => {
		it("sets editor list and marks editors as touched", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: {},
				editors: { count: 3, editors: ["old@test.com"] },
			};
			const changes: AccessChange[] = [{ kind: "setEditorSlots", editors: ["a@test.com", "b@test.com"] }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.editors).toEqual({ count: 3, editors: ["a@test.com", "b@test.com"] });
		});

		it("returns snapshot editors if not touched", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: {},
				editors: { count: 2, editors: ["e@test.com"] },
			};
			const result = applyAccessChanges(snapshot, []);
			expect(result.editors).toBe(snapshot.editors);
		});
	});

	describe("group workspace owner", () => {
		it("sets group workspace owner", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: {},
				workspace: {
					name: "ws",
					sections: {},
					git: { source: { url: "", type: "GitLab", repos: [] } },
					wordTemplates: [],
					pdfTemplates: [],
					access: { workspaceOwner: { gxGroups: [], ssoGroups: [], users: [] } },
				},
			};
			const changes: AccessChange[] = [
				{
					kind: "setGroupWorkspaceOwner",
					groupId: "group-1",
					source: GroupSource.GX_GROUPS,
					owner: true,
				},
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.workspace?.access?.workspaceOwner?.gxGroups).toContain("group-1");
		});
	});

	describe("user workspace owner", () => {
		it("sets user workspace owner", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: {},
				workspace: {
					name: "ws",
					sections: {},
					git: { source: { url: "", type: "GitLab", repos: [] } },
					wordTemplates: [],
					pdfTemplates: [],
					access: { workspaceOwner: { gxGroups: [], users: [] } },
				},
			};
			const changes: AccessChange[] = [{ kind: "setUserWorkspaceOwner", userId: "user@test.com", owner: true }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.workspace?.access?.workspaceOwner?.users).toEqual([{ value: "user@test.com" }]);
		});
	});

	describe("removeUserEverywhere", () => {
		it("removes user from all resources, groups, and editors", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [{ value: "user@test.com", role: "editor" }],
							groups: [],
							externalUsers: [],
							ssoGroups: [],
						},
					},
					{
						id: "repo-2",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [{ value: "user@test.com", role: "reader" }],
							groups: [],
							externalUsers: [],
							ssoGroups: [],
						},
					},
				],
				groups: {
					"group-1": { name: "G1", members: [{ value: "user@test.com" }] },
				},
				editors: { count: 3, editors: ["user@test.com", "other@test.com"] },
			};
			const changes: AccessChange[] = [{ kind: "removeUserEverywhere", userId: "user@test.com" }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.users).toHaveLength(0);
			expect(result.resources[1].access.users).toHaveLength(0);
			expect(result.groups["group-1"].members).toHaveLength(0);
			expect(result.editors?.editors).toEqual(["other@test.com"]);
		});
	});

	describe("guest access", () => {
		it("sets guest access on resource", () => {
			const snapshot = snapshotWithResource();
			const changes: AccessChange[] = [
				{ kind: "setGuestAccess", userId: "guest@test.com", resourceId: "repo-1" },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.externalUsers).toEqual([{ value: "guest@test.com", role: "reader" }]);
		});

		it("removes guest access from resource", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [],
							groups: [],
							externalUsers: [{ value: "guest@test.com", role: "reader" }],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{ kind: "removeGuestAccess", userId: "guest@test.com", resourceId: "repo-1" },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.externalUsers).toHaveLength(0);
		});
	});

	describe("removeGuestEverywhere", () => {
		it("removes guest from all resources", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [],
							groups: [],
							externalUsers: [{ value: "guest@test.com", role: "reader" }],
							ssoGroups: [],
						},
					},
					{
						id: "repo-2",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [],
							groups: [],
							externalUsers: [{ value: "guest@test.com", role: "reader" }],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [{ kind: "removeGuestEverywhere", userId: "guest@test.com" }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.externalUsers).toHaveLength(0);
			expect(result.resources[1].access.externalUsers).toHaveLength(0);
		});
	});

	describe("email casing", () => {
		it("removes user access when change email casing differs from config", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [{ value: "ivan@corp.ru", role: "editor" }],
							groups: [],
							externalUsers: [],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{ kind: "removeUserAccess", userId: "IVAN@corp.ru", resourceId: "repo-1" },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.users).toHaveLength(0);
		});

		it("does not duplicate user access when change email casing differs from config", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [{ value: "ivan@corp.ru", role: "reader" }],
							groups: [],
							externalUsers: [],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{ kind: "setUserAccess", userId: "IVAN@corp.ru", resourceId: "repo-1", role: "editor" },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.users).toHaveLength(1);
			expect(result.resources[0].access.users[0].role).toBe("editor");
		});

		it("does not duplicate guest access when change email casing differs from config", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [],
							groups: [],
							externalUsers: [{ value: "guest@corp.ru", role: "reader" }],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [
				{ kind: "setGuestAccess", userId: "GUEST@corp.ru", resourceId: "repo-1" },
				{ kind: "removeGuestAccess", userId: "Guest@Corp.ru", resourceId: "repo-1" },
			];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.externalUsers).toHaveLength(0);
		});

		it("keeps user group membership stable when casing differs from config", () => {
			const snapshot: AccessSnapshot = {
				resources: [],
				groups: {
					"group-1": { name: "G1", members: [{ value: "ivan@corp.ru" }] },
					"group-2": { name: "G2", members: [{ value: "ivan@corp.ru" }] },
				},
			};
			const changes: AccessChange[] = [{ kind: "setUserGroups", email: "IVAN@corp.ru", groupIds: ["group-1"] }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.groups["group-1"].members).toEqual([{ value: "ivan@corp.ru" }]);
			expect(result.groups["group-2"].members).toEqual([]);
		});

		it("removes user everywhere when casing differs from config", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [{ value: "ivan@corp.ru", role: "editor" }],
							groups: [],
							externalUsers: [],
							ssoGroups: [],
						},
					},
				],
				groups: { "group-1": { name: "G1", members: [{ value: "ivan@corp.ru" }] } },
				editors: { count: 3, editors: ["ivan@corp.ru", "other@corp.ru"] },
			};
			const changes: AccessChange[] = [{ kind: "removeUserEverywhere", userId: "IVAN@corp.ru" }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.users).toHaveLength(0);
			expect(result.groups["group-1"].members).toHaveLength(0);
			expect(result.editors?.editors).toEqual(["other@corp.ru"]);
		});

		it("removes guest everywhere when casing differs from config", () => {
			const snapshot: AccessSnapshot = {
				resources: [
					{
						id: "repo-1",
						mainBranch: "main",
						mainBranchProtected: false,
						access: {
							users: [],
							groups: [],
							externalUsers: [{ value: "guest@corp.ru", role: "reader" }],
							ssoGroups: [],
						},
					},
				],
				groups: {},
			};
			const changes: AccessChange[] = [{ kind: "removeGuestEverywhere", userId: "GUEST@corp.ru" }];
			const result = applyAccessChanges(snapshot, changes);
			expect(result.resources[0].access.externalUsers).toHaveLength(0);
		});
	});

	it("does not mutate the original snapshot", () => {
		const snapshot = snapshotWithResource();
		const originalResources = snapshot.resources;
		const changes: AccessChange[] = [
			{ kind: "setUserAccess", userId: "u@test.com", resourceId: "repo-1", role: "editor" },
		];
		applyAccessChanges(snapshot, changes);
		expect(snapshot.resources).toBe(originalResources);
	});
});
