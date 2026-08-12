import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { act, renderHook } from "@testing-library/react";
import {
	makeAggregate,
	makeGroup,
	makeGuest,
	makeRepo,
	makeRepoAccesses,
	makeRepoGroupAccess,
	makeRepoGuestAccess,
	makeRepoUserAccess,
	makeUser,
} from "../../../__tests__/fixtures";
import type { GesRepo } from "../../../members/model/Member";
import { useBulkRepoCard } from "../useBulkRepoCard";

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => ({ searchBranches: async () => [] }),
}));

type RenderDeps = Parameters<typeof makeAggregate>[0];

const render = (repos: GesRepo[], deps: RenderDeps = {}) => {
	const aggregate = makeAggregate(deps);
	const onApply = jest.fn().mockResolvedValue(true);
	const onClose = jest.fn();
	const result = renderHook(() => useBulkRepoCard({ repos, aggregate, onApply, onClose }));
	return { ...result, onApply, onClose };
};

describe("useBulkRepoCard", () => {
	const repo1 = makeRepo("repo-1");
	const repo2 = makeRepo("repo-2");
	const group = makeGroup("group-1");
	const user = makeUser("user@test.com");
	const guest = makeGuest("guest@test.com");

	describe("bulk add access", () => {
		it("calls onApply with setGroupAccess, setUserAccess, setGuestAccess for all repos", async () => {
			const { result, onApply } = render([repo1, repo2], {
				repos: [repo1, repo2],
				groups: [group],
				users: [user],
				guests: [guest],
				repoAccesses: [
					["repo-1", makeRepoAccesses()],
					["repo-2", makeRepoAccesses()],
				],
			});

			act(() => {
				result.current.group.picker.picked([makeRepoGroupAccess(group, "editor")]);
			});
			act(() => {
				result.current.user.picker.picked([makeRepoUserAccess(user, "reader")]);
			});
			act(() => {
				result.current.guest.picker.picked([makeRepoGuestAccess(guest)]);
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
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "reader" },
				{ kind: "setGuestAccess", userId: "guest@test.com", resourceId: "repo-1" },
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					resourceId: "repo-2",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-2", role: "reader" },
				{ kind: "setGuestAccess", userId: "guest@test.com", resourceId: "repo-2" },
			]);
		});
	});

	describe("bulk remove access", () => {
		it("calls onApply with removeGroupAccess, removeUserAccess, removeGuestAccess", async () => {
			const { result, onApply } = render([repo1], {
				repos: [repo1],
				groups: [group],
				users: [user],
				guests: [guest],
				repoAccesses: [
					[
						"repo-1",
						makeRepoAccesses({
							groups: [makeRepoGroupAccess(group, "editor")],
							users: [makeRepoUserAccess(user, "reader")],
							guests: [makeRepoGuestAccess(guest)],
						}),
					],
				],
			});

			act(() => {
				result.current.group.setSelection({ [group.id]: true });
			});
			act(() => {
				result.current.group.removeSelected();
			});
			act(() => {
				result.current.user.setSelection({ [user.value]: true });
			});
			act(() => {
				result.current.user.removeSelected();
			});
			act(() => {
				result.current.guest.setSelection({ [guest.value]: true });
			});
			act(() => {
				result.current.guest.removeSelected();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "removeGroupAccess", groupId: "group-1", source: GroupSource.GX_GROUPS, resourceId: "repo-1" },
				{ kind: "removeUserAccess", userId: "user@test.com", resourceId: "repo-1" },
				{ kind: "removeGuestAccess", userId: "guest@test.com", resourceId: "repo-1" },
			]);
		});
	});

	describe("bulk change role", () => {
		it("calls onApply with setGroupAccess and setUserAccess for changed roles across repos", async () => {
			const repo3 = makeRepo("repo-3");
			const { result, onApply } = render([repo1, repo2, repo3], {
				repos: [repo1, repo2, repo3],
				groups: [group],
				users: [user],
				repoAccesses: [
					[
						"repo-1",
						makeRepoAccesses({
							groups: [makeRepoGroupAccess(group, "reader")],
							users: [makeRepoUserAccess(user, "reader")],
						}),
					],
					[
						"repo-2",
						makeRepoAccesses({
							groups: [makeRepoGroupAccess(group, "reader")],
							users: [makeRepoUserAccess(user, "reader")],
						}),
					],
					[
						"repo-3",
						makeRepoAccesses({
							groups: [makeRepoGroupAccess(group, "reader")],
							users: [makeRepoUserAccess(user, "reader")],
						}),
					],
				],
			});

			act(() => {
				result.current.group.picker.picked([makeRepoGroupAccess(group, "editor")]);
			});
			act(() => {
				result.current.user.picker.picked([makeRepoUserAccess(user, "editor")]);
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
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-1", role: "editor" },
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					resourceId: "repo-2",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-2", role: "editor" },
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					resourceId: "repo-3",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-3", role: "editor" },
			]);
		});
	});

	describe("bulk apply to all", () => {
		it("applies group access to all repos when only one has it", async () => {
			const { result, onApply } = render([repo1, repo2], {
				repos: [repo1, repo2],
				groups: [group],
				repoAccesses: [
					["repo-1", makeRepoAccesses({ groups: [makeRepoGroupAccess(group, "editor")] })],
					["repo-2", makeRepoAccesses()],
				],
			});

			act(() => {
				result.current.group.setSelection({ [group.id]: true });
			});
			act(() => {
				result.current.group.addSelectedToAll();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					resourceId: "repo-2",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
			]);
		});

		it("applies user access to all repos", async () => {
			const { result, onApply } = render([repo1, repo2], {
				repos: [repo1, repo2],
				users: [user],
				repoAccesses: [
					["repo-1", makeRepoAccesses({ users: [makeRepoUserAccess(user, "editor")] })],
					["repo-2", makeRepoAccesses()],
				],
			});

			act(() => {
				result.current.user.setSelection({ [user.value]: true });
			});
			act(() => {
				result.current.user.addSelectedToAll();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserAccess", userId: "user@test.com", resourceId: "repo-2", role: "editor" },
			]);
		});
	});
});
