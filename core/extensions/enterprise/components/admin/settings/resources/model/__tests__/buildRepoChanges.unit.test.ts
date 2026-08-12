import type {
	RepoGroupAccess,
	RepoGuestAccess,
	RepoUserAccess,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { buildRepoChanges } from "../buildRepoChanges";

const makeGroupAccess = (id: string, role: "editor" | "reader" | "reviewer"): RepoGroupAccess => ({
	group: { id, name: id, source: GroupSource.GX_GROUPS, isWorkspaceOwner: false, isSystem: false },
	role,
});

const makeUserAccess = (
	value: string,
	role: "editor" | "reader" | "reviewer",
	branches?: string[],
): RepoUserAccess => ({
	user: { value, isEditor: false, isWorkspaceOwner: false },
	role,
	branches,
});

const makeGuestAccess = (value: string): RepoGuestAccess => ({
	guest: { value },
	role: "reader",
});

describe("buildRepoChanges", () => {
	const baseInput = {
		repoId: "repo-1",
		mainBranch: "main",
		branchProtected: true,
		origMainBranch: "main",
		origBranchProtected: true,
		origGroupAccess: [] as RepoGroupAccess[],
		origUserAccess: [] as RepoUserAccess[],
		origGuestAccess: [] as RepoGuestAccess[],
		draftGroupAccess: [] as RepoGroupAccess[],
		draftUserAccess: [] as RepoUserAccess[],
		draftGuestAccess: [] as RepoGuestAccess[],
	};

	it("returns empty changes when nothing changed", () => {
		const result = buildRepoChanges(baseInput);
		expect(result).toHaveLength(0);
	});

	describe("setResource", () => {
		it("adds setResource when mainBranch differs", () => {
			const result = buildRepoChanges({ ...baseInput, mainBranch: "develop" });
			expect(result).toContainEqual({
				kind: "setResource",
				resourceId: "repo-1",
				mainBranch: "develop",
				branchProtected: true,
			});
		});

		it("adds setResource when branchProtected differs", () => {
			const result = buildRepoChanges({ ...baseInput, branchProtected: false, origBranchProtected: true });
			expect(result).toContainEqual({
				kind: "setResource",
				resourceId: "repo-1",
				mainBranch: "main",
				branchProtected: false,
			});
		});

		it("handles undefined mainBranch", () => {
			const result = buildRepoChanges({
				...baseInput,
				mainBranch: undefined,
				origMainBranch: "main",
				branchProtected: true,
				origBranchProtected: true,
			});
			expect(result).toContainEqual({
				kind: "setResource",
				resourceId: "repo-1",
				mainBranch: undefined,
				branchProtected: true,
			});
		});
	});

	describe("group access", () => {
		it("adds setGroupAccess for new group", () => {
			const result = buildRepoChanges({
				...baseInput,
				draftGroupAccess: [makeGroupAccess("group-1", "editor")],
			});
			expect(result).toContainEqual({
				kind: "setGroupAccess",
				groupId: "group-1",
				resourceId: "repo-1",
				source: GroupSource.GX_GROUPS,
				role: "editor",
			});
		});

		it("adds setGroupAccess when group role changes", () => {
			const result = buildRepoChanges({
				...baseInput,
				origGroupAccess: [makeGroupAccess("group-1", "reader")],
				draftGroupAccess: [makeGroupAccess("group-1", "editor")],
			});
			expect(result).toContainEqual({
				kind: "setGroupAccess",
				groupId: "group-1",
				resourceId: "repo-1",
				source: GroupSource.GX_GROUPS,
				role: "editor",
			});
		});

		it("adds removeGroupAccess for removed group", () => {
			const result = buildRepoChanges({
				...baseInput,
				origGroupAccess: [makeGroupAccess("group-1", "editor")],
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
			const result = buildRepoChanges({
				...baseInput,
				draftUserAccess: [makeUserAccess("user@test.com", "editor")],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
			});
		});

		it("adds setUserAccess when user role changes", () => {
			const result = buildRepoChanges({
				...baseInput,
				origUserAccess: [makeUserAccess("user@test.com", "reader")],
				draftUserAccess: [makeUserAccess("user@test.com", "editor")],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
			});
		});

		it("adds setUserAccess when user branches change", () => {
			const result = buildRepoChanges({
				...baseInput,
				origUserAccess: [makeUserAccess("user@test.com", "editor", ["main"])],
				draftUserAccess: [makeUserAccess("user@test.com", "editor", ["feature/*"])],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
				branches: ["feature/*"],
			});
		});

		it("adds removeUserAccess for removed user", () => {
			const result = buildRepoChanges({
				...baseInput,
				origUserAccess: [makeUserAccess("user@test.com", "editor")],
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
			const result = buildRepoChanges({
				...baseInput,
				draftGuestAccess: [makeGuestAccess("guest@test.com")],
			});
			expect(result).toContainEqual({
				kind: "setGuestAccess",
				userId: "guest@test.com",
				resourceId: "repo-1",
			});
		});

		it("adds removeGuestAccess for removed guest", () => {
			const result = buildRepoChanges({
				...baseInput,
				origGuestAccess: [makeGuestAccess("guest@test.com")],
			});
			expect(result).toContainEqual({
				kind: "removeGuestAccess",
				userId: "guest@test.com",
				resourceId: "repo-1",
			});
		});

		it("no change when same guest present", () => {
			const result = buildRepoChanges({
				...baseInput,
				origGuestAccess: [makeGuestAccess("guest@test.com")],
				draftGuestAccess: [makeGuestAccess("guest@test.com")],
			});
			expect(result.filter((c) => c.kind === "setGuestAccess" || c.kind === "removeGuestAccess")).toHaveLength(0);
		});
	});

	it("produces multiple changes simultaneously", () => {
		const result = buildRepoChanges({
			...baseInput,
			mainBranch: "develop",
			origMainBranch: "main",
			draftGroupAccess: [makeGroupAccess("group-1", "editor")],
			draftUserAccess: [makeUserAccess("user@test.com", "reader")],
			draftGuestAccess: [makeGuestAccess("guest@test.com")],
		});

		expect(result).toContainEqual({
			kind: "setResource",
			resourceId: "repo-1",
			mainBranch: "develop",
			branchProtected: true,
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
			resourceId: "repo-1",
			role: "reader",
		});
		expect(result).toContainEqual({ kind: "setGuestAccess", userId: "guest@test.com", resourceId: "repo-1" });
	});
});
