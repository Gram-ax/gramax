import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { act, renderHook } from "@testing-library/react";
import { makeAccess, makeAggregate, makeGroup, makeRepo, makeUser } from "../../../__tests__/fixtures";
import type { GroupMember } from "../../../members/model/Member";
import { useGroupCard } from "../useGroupCard";

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => ({ searchBranches: async () => [] }),
}));

type RenderDeps = Parameters<typeof makeAggregate>[0];

const render = (group: GroupMember | null, deps: RenderDeps = {}) => {
	const aggregate = makeAggregate(deps);
	const onApply = jest.fn().mockResolvedValue(true);
	const onClose = jest.fn();
	const result = renderHook(() => useGroupCard({ group, aggregate, onApply, onClose }));
	return { ...result, onApply, onClose };
};

describe("useGroupCard", () => {
	describe("create", () => {
		it("calls onApply with createGroup change", async () => {
			const { result, onApply } = render(null);

			act(() => {
				result.current.data.setName("new-group");
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "createGroup", groupId: "new-group", groupName: "new-group" },
			]);
		});
	});

	describe("create with users", () => {
		it("calls onApply with createGroup and setGroupUsers", async () => {
			const user = makeUser("user@test.com");
			const { result, onApply } = render(null, { users: [user] });

			act(() => {
				result.current.data.setName("new-group");
			});
			act(() => {
				result.current.user.picker.picked([user]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "createGroup", groupId: "new-group", groupName: "new-group" },
				{ kind: "setGroupUsers", groupId: "new-group", emails: ["user@test.com"] },
			]);
		});
	});

	describe("create with accesses", () => {
		it("calls onApply with createGroup and setGroupAccess", async () => {
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(null, { repos: [repo] });

			act(() => {
				result.current.data.setName("new-group");
			});
			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "editor")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "createGroup", groupId: "new-group", groupName: "new-group" },
				{
					kind: "setGroupAccess",
					groupId: "new-group",
					resourceId: "repo-1",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
			]);
		});
	});

	describe("add accesses", () => {
		it("calls onApply with setGroupAccess change", async () => {
			const group = makeGroup("group-1");
			const repo = makeRepo("repo-1");
			const { result, onApply } = render(group, { groups: [group], repos: [repo] });

			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "reader")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					resourceId: "repo-1",
					source: GroupSource.GX_GROUPS,
					role: "reader",
				},
			]);
		});
	});

	describe("add users", () => {
		it("calls onApply with setGroupUsers change", async () => {
			const group = makeGroup("group-1");
			const user = makeUser("user@test.com");
			const { result, onApply } = render(group, {
				groups: [group],
				users: [],
				groupToUsers: [["group-1", []]],
			});

			act(() => {
				result.current.user.picker.picked([user]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setGroupUsers", groupId: "group-1", emails: ["user@test.com"] },
			]);
		});
	});

	describe("remove accesses", () => {
		it("calls onApply with removeGroupAccess change", async () => {
			const group = makeGroup("group-1");
			const repo = makeRepo("repo-1");
			const access = makeAccess("repo-1", "editor");
			const { result, onApply } = render(group, {
				groups: [group],
				repos: [repo],
				groupAccesses: [["group-1", [access]]],
			});

			act(() => {
				result.current.access.setSelection({ [access.resourceId]: true });
			});
			act(() => {
				result.current.access.removeSelected();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "removeGroupAccess", groupId: "group-1", source: GroupSource.GX_GROUPS, resourceId: "repo-1" },
			]);
		});
	});

	describe("remove users", () => {
		it("calls onApply with setGroupUsers empty list", async () => {
			const group = makeGroup("group-1");
			const user = makeUser("user@test.com");
			const { result, onApply } = render(group, {
				groups: [group],
				users: [user],
				groupToUsers: [["group-1", ["user@test.com"]]],
			});

			act(() => {
				result.current.user.setSelection({ "user@test.com": true });
			});
			act(() => {
				result.current.user.removeSelected();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([{ kind: "setGroupUsers", groupId: "group-1", emails: [] }]);
		});
	});

	describe("grant workspaceOwner", () => {
		it("calls onApply with setGroupWorkspaceOwner owner=true", async () => {
			const group = makeGroup("group-1", { isWorkspaceOwner: false });
			const { result, onApply } = render(group, { groups: [group] });

			act(() => {
				result.current.data.setWorkspaceOwner(true);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setGroupWorkspaceOwner", groupId: "group-1", source: GroupSource.GX_GROUPS, owner: true },
			]);
		});
	});

	describe("revoke workspaceOwner", () => {
		it("calls onApply with setGroupWorkspaceOwner owner=false", async () => {
			const group = makeGroup("group-1", { isWorkspaceOwner: true });
			const { result, onApply } = render(group, { groups: [group] });

			act(() => {
				result.current.data.setWorkspaceOwner(false);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setGroupWorkspaceOwner", groupId: "group-1", source: GroupSource.GX_GROUPS, owner: false },
			]);
		});
	});

	describe("remove group", () => {
		it("does not call onApply (no changes, removal is separate action)", async () => {
			const group = makeGroup("group-1");
			const { result, onApply } = render(group, { groups: [group] });

			await act(async () => {
				const ok = await result.current.form.persist();
				expect(ok).toBe(true);
			});

			expect(onApply).not.toHaveBeenCalled();
		});
	});

	describe("change access role", () => {
		it("calls onApply with setGroupAccess for changed role", async () => {
			const group = makeGroup("group-1");
			const repo = makeRepo("repo-1");
			const original = makeAccess("repo-1", "reader");
			const { result, onApply } = render(group, {
				groups: [group],
				repos: [repo],
				groupAccesses: [["group-1", [original]]],
			});

			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "editor")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					resourceId: "repo-1",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
			]);
		});
	});
});
