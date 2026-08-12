import { act, renderHook } from "@testing-library/react";
import { makeAccess, makeAggregate, makeGroup, makeRepo, makeUser } from "../../../__tests__/fixtures";
import type { UserMember } from "../../../members/model/Member";
import { useBulkUsersCard } from "../useBulkUsersCard";

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => ({ searchBranches: async () => [] }),
}));

type RenderDeps = Parameters<typeof makeAggregate>[0];

const render = (users: UserMember[], deps: RenderDeps = {}) => {
	const aggregate = makeAggregate(deps);
	const onApply = jest.fn().mockResolvedValue(true);
	const onClose = jest.fn();
	const result = renderHook(() => useBulkUsersCard({ users, aggregate, onApply, onClose }));
	return { ...result, onApply, onClose };
};

describe("useBulkUsersCard", () => {
	const user1 = makeUser("user1@test.com");
	const user2 = makeUser("user2@test.com");
	const repo = makeRepo("repo-1");
	const group = makeGroup("group-1");

	describe("bulk add access", () => {
		it("calls onApply with setUserAccess for each user", async () => {
			const { result, onApply } = render([user1, user2], {
				users: [user1, user2],
				repos: [repo],
			});

			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "editor")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserAccess", userId: "user1@test.com", resourceId: "repo-1", role: "editor" },
				{ kind: "setUserAccess", userId: "user2@test.com", resourceId: "repo-1", role: "editor" },
			]);
		});
	});

	describe("bulk add groups", () => {
		it("calls onApply with setUserGroups for each user", async () => {
			const { result, onApply } = render([user1, user2], {
				users: [user1, user2],
				groups: [group],
				userToGroups: [
					["user1@test.com", []],
					["user2@test.com", []],
				],
			});

			act(() => {
				result.current.group.picker.picked([group]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserGroups", email: "user1@test.com", groupIds: ["group-1"] },
				{ kind: "setUserGroups", email: "user2@test.com", groupIds: ["group-1"] },
			]);
		});
	});

	describe("bulk change role", () => {
		it("calls onApply with setUserAccess for changed role", async () => {
			const { result, onApply } = render([user1, user2], {
				users: [user1, user2],
				repos: [repo],
				userAccesses: [
					["user1@test.com", [makeAccess("repo-1", "reader")]],
					["user2@test.com", [makeAccess("repo-1", "reader")]],
				],
			});

			act(() => {
				result.current.access.picker.picked([makeAccess("repo-1", "editor")]);
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserAccess", userId: "user1@test.com", resourceId: "repo-1", role: "editor" },
				{ kind: "setUserAccess", userId: "user2@test.com", resourceId: "repo-1", role: "editor" },
			]);
		});
	});

	describe("bulk change branches", () => {
		it("calls onApply with setUserAccess including branches", async () => {
			const { result, onApply } = render([user1], {
				users: [user1],
				repos: [repo],
				userAccesses: [["user1@test.com", [makeAccess("repo-1", "reviewer", ["main"])]]],
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
					userId: "user1@test.com",
					resourceId: "repo-1",
					role: "reviewer",
					branches: ["main", "dev"],
				},
			]);
		});
	});

	describe("bulk remove access", () => {
		it("calls onApply with removeUserAccess for each user", async () => {
			const { result, onApply } = render([user1, user2], {
				users: [user1, user2],
				repos: [repo],
				userAccesses: [
					["user1@test.com", [makeAccess("repo-1", "reader")]],
					["user2@test.com", [makeAccess("repo-1", "reader")]],
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
				{ kind: "removeUserAccess", userId: "user1@test.com", resourceId: "repo-1" },
				{ kind: "removeUserAccess", userId: "user2@test.com", resourceId: "repo-1" },
			]);
		});
	});

	describe("bulk remove groups", () => {
		it("calls onApply with setUserGroups empty for each user", async () => {
			const { result, onApply } = render([user1, user2], {
				users: [user1, user2],
				groups: [group],
				userToGroups: [
					["user1@test.com", ["group-1"]],
					["user2@test.com", ["group-1"]],
				],
			});

			act(() => {
				result.current.group.setSelection({ [group.id]: true });
			});
			act(() => {
				result.current.group.removeSelected();
			});

			await act(async () => {
				await result.current.form.persist();
			});

			expect(onApply).toHaveBeenCalledWith([
				{ kind: "setUserGroups", email: "user1@test.com", groupIds: undefined },
				{ kind: "setUserGroups", email: "user2@test.com", groupIds: undefined },
			]);
		});
	});

	describe("bulk apply to all", () => {
		it("applies access to all users when only one has it", async () => {
			const user3 = makeUser("user3@test.com");
			const { result, onApply } = render([user1, user2, user3], {
				users: [user1, user2, user3],
				repos: [repo],
				userAccesses: [["user1@test.com", [makeAccess("repo-1", "editor")]]],
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
				{ kind: "setUserAccess", userId: "user2@test.com", resourceId: "repo-1", role: "editor" },
				{ kind: "setUserAccess", userId: "user3@test.com", resourceId: "repo-1", role: "editor" },
			]);
		});
	});
});
