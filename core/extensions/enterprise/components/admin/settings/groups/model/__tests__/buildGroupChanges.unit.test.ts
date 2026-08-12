import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { buildGroupChanges } from "../buildGroupChanges";

describe("buildGroupChanges", () => {
	const baseArgs = {
		id: "group-1",
		name: "My Group",
		source: GroupSource.GX_GROUPS,
		isAdd: false,
		accesses: [] as { resourceId: string; role: "editor" | "reader" | "reviewer" }[],
		originalAccesses: [] as { resourceId: string; role: "editor" | "reader" | "reviewer" }[],
		users: [] as string[],
		originalUsers: [] as string[],
		isWorkspaceOwner: false,
		wasWorkspaceOwner: false,
	};

	it("returns empty changes when nothing changed", () => {
		const result = buildGroupChanges(baseArgs);
		expect(result).toHaveLength(0);
	});

	describe("createGroup", () => {
		it("adds createGroup when isAdd is true", () => {
			const result = buildGroupChanges({ ...baseArgs, isAdd: true });
			expect(result).toContainEqual({
				kind: "createGroup",
				groupId: "group-1",
				groupName: "My Group",
			});
		});

		it("no createGroup when isAdd is false", () => {
			const result = buildGroupChanges(baseArgs);
			expect(result.filter((c) => c.kind === "createGroup")).toHaveLength(0);
		});
	});

	describe("access changes", () => {
		it("adds setGroupAccess for new access", () => {
			const result = buildGroupChanges({
				...baseArgs,
				accesses: [{ resourceId: "repo-1", role: "editor" }],
			});
			expect(result).toContainEqual({
				kind: "setGroupAccess",
				groupId: "group-1",
				resourceId: "repo-1",
				source: GroupSource.GX_GROUPS,
				role: "editor",
			});
		});

		it("adds setGroupAccess when role changes", () => {
			const result = buildGroupChanges({
				...baseArgs,
				accesses: [{ resourceId: "repo-1", role: "editor" }],
				originalAccesses: [{ resourceId: "repo-1", role: "reader" }],
			});
			expect(result).toContainEqual({
				kind: "setGroupAccess",
				groupId: "group-1",
				resourceId: "repo-1",
				source: GroupSource.GX_GROUPS,
				role: "editor",
			});
		});

		it("adds removeGroupAccess for removed access", () => {
			const result = buildGroupChanges({
				...baseArgs,
				originalAccesses: [{ resourceId: "repo-1", role: "editor" }],
			});
			expect(result).toContainEqual({
				kind: "removeGroupAccess",
				groupId: "group-1",
				source: GroupSource.GX_GROUPS,
				resourceId: "repo-1",
			});
		});

		it("no change when accesses match", () => {
			const result = buildGroupChanges({
				...baseArgs,
				accesses: [{ resourceId: "repo-1", role: "editor" }],
				originalAccesses: [{ resourceId: "repo-1", role: "editor" }],
			});
			expect(result.filter((c) => c.kind === "setGroupAccess" || c.kind === "removeGroupAccess")).toHaveLength(0);
		});
	});

	describe("user changes", () => {
		it("adds setGroupUsers when users differ (not add)", () => {
			const result = buildGroupChanges({
				...baseArgs,
				isAdd: false,
				users: ["user@test.com"],
				originalUsers: [],
			});
			expect(result).toContainEqual({
				kind: "setGroupUsers",
				groupId: "group-1",
				emails: ["user@test.com"],
			});
		});

		it("adds setGroupUsers when isAdd and users non-empty", () => {
			const result = buildGroupChanges({
				...baseArgs,
				isAdd: true,
				users: ["user@test.com"],
				originalUsers: [],
			});
			expect(result).toContainEqual({
				kind: "setGroupUsers",
				groupId: "group-1",
				emails: ["user@test.com"],
			});
		});

		it("no setGroupUsers when isAdd and users empty", () => {
			const result = buildGroupChanges({
				...baseArgs,
				isAdd: true,
				users: [],
				originalUsers: [],
			});
			expect(result.filter((c) => c.kind === "setGroupUsers")).toHaveLength(0);
		});

		it("no setGroupUsers when users unchanged", () => {
			const result = buildGroupChanges({
				...baseArgs,
				isAdd: false,
				users: ["user@test.com"],
				originalUsers: ["user@test.com"],
			});
			expect(result.filter((c) => c.kind === "setGroupUsers")).toHaveLength(0);
		});
	});

	describe("workspace owner changes", () => {
		it("adds setGroupWorkspaceOwner when becomes owner", () => {
			const result = buildGroupChanges({
				...baseArgs,
				isWorkspaceOwner: true,
				wasWorkspaceOwner: false,
			});
			expect(result).toContainEqual({
				kind: "setGroupWorkspaceOwner",
				groupId: "group-1",
				source: GroupSource.GX_GROUPS,
				owner: true,
			});
		});

		it("adds setGroupWorkspaceOwner when loses ownership", () => {
			const result = buildGroupChanges({
				...baseArgs,
				isWorkspaceOwner: true,
				wasWorkspaceOwner: true,
			});
			expect(result.filter((c) => c.kind === "setGroupWorkspaceOwner")).toHaveLength(0);
		});
	});

	it("produces multiple changes simultaneously", () => {
		const result = buildGroupChanges({
			...baseArgs,
			isAdd: true,
			accesses: [{ resourceId: "repo-1", role: "editor" }],
			users: ["user@test.com"],
			isWorkspaceOwner: true,
			wasWorkspaceOwner: false,
		});

		expect(result).toContainEqual({ kind: "createGroup", groupId: "group-1", groupName: "My Group" });
		expect(result).toContainEqual({
			kind: "setGroupAccess",
			groupId: "group-1",
			resourceId: "repo-1",
			source: GroupSource.GX_GROUPS,
			role: "editor",
		});
		expect(result).toContainEqual({ kind: "setGroupUsers", groupId: "group-1", emails: ["user@test.com"] });
		expect(result).toContainEqual({
			kind: "setGroupWorkspaceOwner",
			groupId: "group-1",
			source: GroupSource.GX_GROUPS,
			owner: true,
		});
	});
});
