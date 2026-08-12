import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { act, renderHook } from "@testing-library/react";
import { makeAccess, makeAggregate, makeGroup, makeRepo, makeUser } from "../../../__tests__/fixtures";
import type { GesRepo, GroupMember } from "../../../members/model/Member";
import { useBulkGroupsCard } from "../useBulkGroupsCard";

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => ({ searchBranches: async () => [] }),
}));

type RenderDeps = Parameters<typeof makeAggregate>[0];

const render = (groups: GroupMember[], deps: RenderDeps = {}) => {
	const aggregate = makeAggregate(deps);
	const onApply = jest.fn().mockResolvedValue(true);
	const onClose = jest.fn();
	const result = renderHook(() => useBulkGroupsCard({ groups, aggregate, onApply, onClose }));
	return { ...result, onApply, onClose };
};

const stubRepo = (id: string): GesRepo => makeRepo(id);

describe("useBulkGroupsCard", () => {
	describe("bulk add access", () => {
		it("calls onApply with setGroupAccess for each group", async () => {
			const group1 = makeGroup("group-1");
			const group2 = makeGroup("group-2");
			const { result, onApply } = render([group1, group2], { groups: [group1, group2] });

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
				{
					kind: "setGroupAccess",
					groupId: "group-2",
					resourceId: "repo-1",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
			]);
		});
	});

	describe("bulk add user", () => {
		it("calls onApply with setGroupUsers for each group", async () => {
			const group1 = makeGroup("group-1");
			const group2 = makeGroup("group-2");
			const user = makeUser("user@test.com");
			const { result, onApply } = render([group1, group2], {
				groups: [group1, group2],
				users: [user],
				groupToUsers: [
					["group-1", []],
					["group-2", []],
				],
			});

			act(() => {
				result.current.user.picker.picked([user]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setGroupUsers", groupId: "group-1", emails: ["user@test.com"] },
				{ kind: "setGroupUsers", groupId: "group-2", emails: ["user@test.com"] },
			]);
		});
	});

	describe("bulk change role", () => {
		it("calls onApply with setGroupAccess for changed role", async () => {
			const group1 = makeGroup("group-1");
			const group2 = makeGroup("group-2");
			const repo = stubRepo("repo-1");
			const { result, onApply } = render([group1, group2], {
				groups: [group1, group2],
				repos: [repo],
				groupAccesses: [
					["group-1", [makeAccess("repo-1", "reader")]],
					["group-2", [makeAccess("repo-1", "reader")]],
				],
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
				{
					kind: "setGroupAccess",
					groupId: "group-2",
					resourceId: "repo-1",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
			]);
		});
	});

	describe("bulk remove access", () => {
		it("calls onApply with removeGroupAccess", async () => {
			const group1 = makeGroup("group-1");
			const group2 = makeGroup("group-2");
			const repo = stubRepo("repo-1");
			const { result, onApply } = render([group1, group2], {
				groups: [group1, group2],
				repos: [repo],
				groupAccesses: [
					["group-1", [makeAccess("repo-1", "reader")]],
					["group-2", [makeAccess("repo-1", "reader")]],
				],
			});

			act(() => {
				result.current.access.setSelection({ "repo-1": true });
			});
			act(() => {
				result.current.access.removeSelected();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "removeGroupAccess", groupId: "group-1", source: GroupSource.GX_GROUPS, resourceId: "repo-1" },
				{ kind: "removeGroupAccess", groupId: "group-2", source: GroupSource.GX_GROUPS, resourceId: "repo-1" },
			]);
		});
	});

	describe("bulk remove user", () => {
		it("calls onApply with setGroupUsers empty for each group", async () => {
			const group1 = makeGroup("group-1");
			const group2 = makeGroup("group-2");
			const user = makeUser("user@test.com");
			const { result, onApply } = render([group1, group2], {
				groups: [group1, group2],
				users: [user],
				groupToUsers: [
					["group-1", ["user@test.com"]],
					["group-2", ["user@test.com"]],
				],
			});

			act(() => {
				result.current.user.setSelection({ [user.value]: true });
			});
			act(() => {
				result.current.user.removeSelected();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setGroupUsers", groupId: "group-1", emails: undefined },
				{ kind: "setGroupUsers", groupId: "group-2", emails: undefined },
			]);
		});
	});

	describe("bulk apply to all", () => {
		it("calls onApply with setGroupAccess applied to all groups", async () => {
			const group1 = makeGroup("group-1");
			const group2 = makeGroup("group-2");
			const group3 = makeGroup("group-3");
			const repo = stubRepo("repo-1");
			const { result, onApply } = render([group1, group2, group3], {
				groups: [group1, group2, group3],
				repos: [repo],
				groupAccesses: [["group-1", [makeAccess("repo-1", "editor")]]],
			});

			act(() => {
				result.current.access.setSelection({ "repo-1": true });
			});
			act(() => {
				result.current.access.addSelectedToAll();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{
					kind: "setGroupAccess",
					groupId: "group-2",
					resourceId: "repo-1",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
				{
					kind: "setGroupAccess",
					groupId: "group-3",
					resourceId: "repo-1",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
			]);
		});
	});
});
