import { buildUserChanges } from "../buildUserChanges";

describe("buildUserChanges", () => {
	const baseInput = {
		email: "user@test.com",
		isAdd: false,
		isEditor: undefined as boolean | undefined,
		wasEditor: undefined as boolean | undefined,
		editorsList: [] as string[],
		accesses: [] as { resourceId: string; role: "editor" | "reader" | "reviewer"; branches?: string[] }[],
		originalAccesses: [] as { resourceId: string; role: "editor" | "reader" | "reviewer"; branches?: string[] }[],
		groups: [] as string[],
		originalGroups: [] as string[],
		isWorkspaceOwner: false,
		wasWorkspaceOwner: false,
	};

	it("returns empty changes when nothing changed", () => {
		const result = buildUserChanges(baseInput);
		expect(result).toHaveLength(0);
	});

	describe("editor changes", () => {
		it("adds setEditorSlots when user becomes editor", () => {
			const result = buildUserChanges({
				...baseInput,
				isEditor: true,
				wasEditor: false,
				editorsList: ["existing@test.com"],
			});
			expect(result).toContainEqual({
				kind: "setEditorSlots",
				editors: ["existing@test.com", "user@test.com"],
			});
		});

		it("adds setEditorSlots when user is removed from editors", () => {
			const result = buildUserChanges({
				...baseInput,
				isEditor: false,
				wasEditor: true,
				editorsList: ["existing@test.com", "user@test.com"],
			});
			expect(result).toContainEqual({
				kind: "setEditorSlots",
				editors: ["existing@test.com"],
			});
		});

		it("adds setEditorSlots with deduplicated email", () => {
			const result = buildUserChanges({
				...baseInput,
				isEditor: true,
				wasEditor: false,
				editorsList: ["user@test.com"],
			});
			expect(result).toContainEqual({
				kind: "setEditorSlots",
				editors: ["user@test.com"],
			});
		});
	});

	describe("access changes", () => {
		it("adds setUserAccess for new access with different role", () => {
			const result = buildUserChanges({
				...baseInput,
				accesses: [{ resourceId: "repo-1", role: "editor" }],
				originalAccesses: [{ resourceId: "repo-1", role: "reader" }],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
			});
		});

		it("adds setUserAccess for new access", () => {
			const result = buildUserChanges({
				...baseInput,
				accesses: [{ resourceId: "repo-1", role: "editor" }],
				originalAccesses: [],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
			});
		});

		it("adds setUserAccess when branches differ", () => {
			const result = buildUserChanges({
				...baseInput,
				accesses: [{ resourceId: "repo-1", role: "editor", branches: ["feature/*"] }],
				originalAccesses: [{ resourceId: "repo-1", role: "editor", branches: ["main"] }],
			});
			expect(result).toContainEqual({
				kind: "setUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
				role: "editor",
				branches: ["feature/*"],
			});
		});

		it("adds removeUserAccess for removed access", () => {
			const result = buildUserChanges({
				...baseInput,
				accesses: [],
				originalAccesses: [{ resourceId: "repo-1", role: "editor" }],
			});
			expect(result).toContainEqual({
				kind: "removeUserAccess",
				userId: "user@test.com",
				resourceId: "repo-1",
			});
		});

		it("no change when accesses match", () => {
			const result = buildUserChanges({
				...baseInput,
				accesses: [{ resourceId: "repo-1", role: "editor" }],
				originalAccesses: [{ resourceId: "repo-1", role: "editor" }],
			});
			expect(result.filter((c) => c.kind === "setUserAccess" || c.kind === "removeUserAccess")).toHaveLength(0);
		});
	});

	describe("group changes", () => {
		it("adds setUserGroups when groups differ (not add)", () => {
			const result = buildUserChanges({
				...baseInput,
				isAdd: false,
				groups: ["group-1"],
				originalGroups: ["group-2"],
			});
			expect(result).toContainEqual({
				kind: "setUserGroups",
				email: "user@test.com",
				groupIds: ["group-1"],
			});
		});

		it("adds setUserGroups when isAdd and groups non-empty", () => {
			const result = buildUserChanges({
				...baseInput,
				isAdd: true,
				groups: ["group-1"],
				originalGroups: [],
			});
			expect(result).toContainEqual({
				kind: "setUserGroups",
				email: "user@test.com",
				groupIds: ["group-1"],
			});
		});

		it("no setUserGroups when isAdd and groups empty", () => {
			const result = buildUserChanges({
				...baseInput,
				isAdd: true,
				groups: [],
				originalGroups: [],
			});
			expect(result.filter((c) => c.kind === "setUserGroups")).toHaveLength(0);
		});

		it("no setUserGroups when groups unchanged", () => {
			const result = buildUserChanges({
				...baseInput,
				isAdd: false,
				groups: ["group-1"],
				originalGroups: ["group-1"],
			});
			expect(result.filter((c) => c.kind === "setUserGroups")).toHaveLength(0);
		});
	});

	describe("workspace owner changes", () => {
		it("adds setUserWorkspaceOwner when becomes owner", () => {
			const result = buildUserChanges({
				...baseInput,
				isWorkspaceOwner: true,
				wasWorkspaceOwner: false,
			});
			expect(result).toContainEqual({
				kind: "setUserWorkspaceOwner",
				userId: "user@test.com",
				owner: true,
			});
		});

		it("adds setUserWorkspaceOwner when loses ownership", () => {
			const result = buildUserChanges({
				...baseInput,
				isWorkspaceOwner: true,
				wasWorkspaceOwner: true,
			});
			expect(result.filter((c) => c.kind === "setUserWorkspaceOwner")).toHaveLength(0);
		});
	});

	it("produces multiple changes simultaneously", () => {
		const result = buildUserChanges({
			...baseInput,
			isEditor: true,
			wasEditor: false,
			editorsList: [],
			accesses: [{ resourceId: "repo-1", role: "editor" }],
			originalAccesses: [],
			isAdd: true,
			groups: ["group-1"],
			originalGroups: [],
			isWorkspaceOwner: true,
			wasWorkspaceOwner: false,
		});

		expect(result).toContainEqual({ kind: "setEditorSlots", editors: ["user@test.com"] });
		expect(result).toContainEqual({
			kind: "setUserAccess",
			userId: "user@test.com",
			resourceId: "repo-1",
			role: "editor",
		});
		expect(result).toContainEqual({ kind: "setUserGroups", email: "user@test.com", groupIds: ["group-1"] });
		expect(result).toContainEqual({ kind: "setUserWorkspaceOwner", userId: "user@test.com", owner: true });
	});
});
