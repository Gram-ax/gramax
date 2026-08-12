import { act, renderHook } from "@testing-library/react";
import { makeAccess, makeAggregate, makeGroup, makeRepo, makeUser } from "../../../__tests__/fixtures";
import type { AccessChange } from "../../../members/model/AccessChange";
import type { UserMember } from "../../../members/model/Member";
import { useUserCard } from "../useUserCard";

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => ({ searchBranches: async () => [] }),
}));

type RenderDeps = Parameters<typeof makeAggregate>[0];

const render = (user: UserMember | null, deps: RenderDeps = {}) => {
	const aggregate = makeAggregate(deps);
	const onApply = jest.fn().mockResolvedValue(true);
	const onClose = jest.fn();
	const result = renderHook(() => useUserCard({ user, aggregate, onApply, onClose }));
	return { ...result, onApply, onClose };
};

describe("useUserCard", () => {
	describe("create user", () => {
		it("calls onApply with setUserAccess when email and access provided", async () => {
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(null, {
				repos: [repo],
				editorsCount: 3,
				editors: [],
			});

			act(() => {
				result.current.data.setEmail("new@test.com");
			});
			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "reader")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserAccess", userId: "new@test.com", resourceId: "repo-1", role: "reader" },
			]);
		});
	});

	describe("create user with access", () => {
		it("calls onApply with setUserAccess and create", async () => {
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(null, {
				repos: [repo],
				editorsCount: 3,
				editors: [],
			});

			act(() => {
				result.current.data.setEmail("new@test.com");
			});
			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "editor")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserAccess", userId: "new@test.com", resourceId: "repo-1", role: "editor" },
			]);
		});
	});

	describe("create user with groups", () => {
		it("calls onApply with setUserGroups", async () => {
			const group = makeGroup("group-1");
			const { result, onApply } = render(null, {
				groups: [group],
				editorsCount: 3,
				editors: [],
			});

			act(() => {
				result.current.data.setEmail("new@test.com");
			});
			act(() => {
				result.current.group.picker.picked([group]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserGroups", email: "new@test.com", groupIds: ["group-1"] },
			]);
		});
	});

	describe("add user access", () => {
		it("calls onApply with setUserAccess", async () => {
			const user = makeUser("user@test.com");
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(user, {
				users: [user],
				repos: [repo],
			});

			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "reader")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "reader" },
			]);
		});
	});

	describe("add user groups", () => {
		it("calls onApply with setUserGroups", async () => {
			const user = makeUser("user@test.com");
			const group = makeGroup("group-1");
			const { result, onApply } = render(user, {
				users: [user],
				groups: [group],
			});

			act(() => {
				result.current.group.picker.picked([group]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserGroups", email: "user@test.com", groupIds: ["group-1"] },
			]);
		});
	});

	describe("grant editor", () => {
		it("calls onApply with setEditorSlots", async () => {
			const user = makeUser("user@test.com", { isEditor: false });
			const { result, onApply } = render(user, {
				users: [user],
				editors: [],
				editorsCount: 3,
			});

			act(() => {
				result.current.data.setIsEditor(true);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			const editorChange = onApply.mock.calls[0][0].find((c: AccessChange) => c.kind === "setEditorSlots");
			expect(editorChange).toEqual({ kind: "setEditorSlots", editors: ["user@test.com"] });
		});
	});

	describe("grant workspaceOwner", () => {
		it("calls onApply with setUserWorkspaceOwner owner=true", async () => {
			const user = makeUser("user@test.com", { isWorkspaceOwner: false });
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(user, {
				users: [user],
				repos: [repo],
				editorsCount: 0,
				editors: [],
				userAccesses: [["user@test.com", [makeAccess("repo-1", "reader")]]],
			});

			act(() => {
				result.current.data.setWorkspaceOwner(true);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserWorkspaceOwner", userId: "user@test.com", owner: true },
			]);
		});
	});

	describe("change access role", () => {
		it("calls onApply with setUserAccess for changed role", async () => {
			const user = makeUser("user@test.com");
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(user, {
				users: [user],
				repos: [repo],
				userAccesses: [["user@test.com", [makeAccess("repo-1", "reader")]]],
			});

			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "editor")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "editor" },
			]);
		});
	});

	describe("change access branches", () => {
		it("calls onApply with setUserAccess including branches", async () => {
			const user = makeUser("user@test.com");
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(user, {
				users: [user],
				repos: [repo],
				userAccesses: [["user@test.com", [makeAccess("repo-1", "reviewer", ["main"])]]],
			});

			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "reviewer", ["main", "dev"])]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{
					kind: "setUserAccess",
					userId: "user@test.com",
					resourceId: "repo-1",
					role: "reviewer",
					branches: ["main", "dev"],
				},
			]);
		});
	});

	describe("remove user", () => {
		it("does not produce changes from card (removal is separate removeUserEverywhere action)", async () => {
			const user = makeUser("user@test.com");
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(user, {
				users: [user],
				repos: [repo],
				editorsCount: 0,
				editors: [],
				userAccesses: [["user@test.com", [makeAccess("repo-1", "reader")]]],
			});

			await act(async () => {
				const ok = await result.current.form.persist();
				expect(ok).toBe(true);
			});

			expect(onApply).not.toHaveBeenCalled();
		});
	});
});
