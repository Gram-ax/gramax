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
import { useRepoCard } from "../useRepoCard";

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => ({ searchBranches: async () => [] }),
}));

type RenderDeps = Parameters<typeof makeAggregate>[0];

const render = (repo: GesRepo | undefined, deps: RenderDeps = {}) => {
	const aggregate = makeAggregate(deps);
	const onApply = jest.fn().mockResolvedValue(true);
	const onClose = jest.fn();
	const result = renderHook(() => useRepoCard({ repo, aggregate, onApply, onClose, repoCandidates: [] }));
	return { ...result, onApply, onClose };
};

describe("useRepoCard", () => {
	const repo = makeRepo("repo-1");
	const group = makeGroup("group-1");
	const user = makeUser("user@test.com");
	const guest = makeGuest("guest@test.com");

	describe("create", () => {
		it("calls onApply with setResource for new repo", async () => {
			const { result, onApply } = render(undefined, {
				repos: [],
				groups: [],
				users: [],
				guests: [],
			});

			act(() => {
				result.current.repoFormState.data.setRepoId("new-repo");
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setResource", resourceId: "new-repo", mainBranch: undefined, branchProtected: false },
			]);
		});
	});

	describe("create with access", () => {
		it("calls onApply with setResource and setGroupAccess", async () => {
			const { result, onApply } = render(undefined, {
				repos: [],
				groups: [group],
				users: [],
				guests: [],
			});

			act(() => {
				result.current.repoFormState.data.setRepoId("new-repo");
			});
			act(() => {
				result.current.repoFormState.groupAccess.add([makeRepoGroupAccess(group, "editor")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setResource", resourceId: "new-repo", mainBranch: undefined, branchProtected: false },
				{
					kind: "setGroupAccess",
					groupId: "group-1",
					resourceId: "new-repo",
					source: GroupSource.GX_GROUPS,
					role: "editor",
				},
			]);
		});
	});

	describe("change main branch", () => {
		it("calls onApply with setResource for changed branch", async () => {
			const { result, onApply } = render(repo, {
				repos: [repo],
				groups: [],
				users: [],
				guests: [],
				repoAccesses: [["repo-1", makeRepoAccesses()]],
			});

			act(() => {
				result.current.repoFormState.data.setBranchValue("develop");
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "develop", branchProtected: false },
			]);
		});
	});

	describe("change main branch protected", () => {
		it("calls onApply with setResource for changed protected flag", async () => {
			const { result, onApply } = render(repo, {
				repos: [repo],
				groups: [],
				users: [],
				guests: [],
				repoAccesses: [["repo-1", makeRepoAccesses()]],
			});

			act(() => {
				result.current.repoFormState.data.setBranchProtected(true);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setResource", resourceId: "repo-1", mainBranch: "main", branchProtected: true },
			]);
		});
	});

	describe("add access", () => {
		it("calls onApply with setGroupAccess, setUserAccess, setGuestAccess", async () => {
			const repoAccesses = makeRepoAccesses();
			const { result, onApply } = render(repo, {
				repos: [repo],
				groups: [group],
				users: [user],
				guests: [guest],
				repoAccesses: [["repo-1", repoAccesses]],
			});

			act(() => {
				result.current.repoFormState.groupAccess.add([makeRepoGroupAccess(group, "editor")]);
			});
			act(() => {
				result.current.repoFormState.userAccess.add([makeRepoUserAccess(user, "reader")]);
			});
			act(() => {
				result.current.repoFormState.guestAccess.add([makeRepoGuestAccess(guest)]);
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
			]);
		});
	});

	describe("remove access", () => {
		it("calls onApply with removeGroupAccess and removeUserAccess", async () => {
			const { result, onApply } = render(repo, {
				repos: [repo],
				groups: [group],
				users: [user],
				repoAccesses: [
					[
						"repo-1",
						makeRepoAccesses({
							groups: [makeRepoGroupAccess(group, "editor")],
							users: [makeRepoUserAccess(user, "reader")],
						}),
					],
				],
			});

			act(() => {
				result.current.repoFormState.groupAccess.remove([makeRepoGroupAccess(group, "editor")]);
			});
			act(() => {
				result.current.repoFormState.userAccess.remove([makeRepoUserAccess(user, "reader")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "removeGroupAccess", groupId: "group-1", source: GroupSource.GX_GROUPS, resourceId: "repo-1" },
				{ kind: "removeUserAccess", userId: "user@test.com", resourceId: "repo-1" },
			]);
		});
	});

	describe("change access role", () => {
		it("calls onApply with setGroupAccess and setUserAccess for changed roles", async () => {
			const { result, onApply } = render(repo, {
				repos: [repo],
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
				],
			});

			act(() => {
				result.current.repoFormState.groupAccess.setRole(["group-1"], "editor");
			});
			act(() => {
				result.current.repoFormState.userAccess.setRole(["user@test.com"], "editor");
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
			]);
		});
	});
});
