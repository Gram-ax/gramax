import type { UserMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import type { searchUserInfo } from "@ext/enterprise/EnterpriseService";
import { act, renderHook, waitFor } from "@testing-library/react";
import { makeAggregate, makeUser } from "../../../__tests__/fixtures";
import { useUserList } from "../useUserList";

const mockSettings = {
	ssoUsersEnabled: false,
	searchUsers: jest.fn<Promise<searchUserInfo[]>, [string]>(),
};

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => mockSettings,
}));

const render = (users: UserMember[], enabled = true) => {
	const onUsersLoad = jest.fn();
	const aggregate = makeAggregate({ users });
	const result = renderHook(() => useUserList({ aggregate, enabled, onUsersLoad }));
	return { ...result, onUsersLoad };
};

const search = (result: { current: ReturnType<typeof useUserList> }, query: string) =>
	act(() => result.current.filter.query.set(query));

beforeEach(() => {
	mockSettings.ssoUsersEnabled = false;
	mockSettings.searchUsers.mockReset();
});

describe("useUserList", () => {
	it("returns every local user when sso is off", () => {
		const users = [makeUser("a@test.com"), makeUser("b@test.com")];
		const { result, onUsersLoad } = render(users);

		expect(result.current.data).toEqual({ users, isLoading: false });
		expect(onUsersLoad).toHaveBeenCalledWith(users);
	});

	it("returns nothing while disabled", () => {
		const { result, onUsersLoad } = render([makeUser("a@test.com")], false);

		expect(result.current.data).toEqual({ users: [], isLoading: false });
		expect(onUsersLoad).not.toHaveBeenCalled();
	});

	it("keeps every local user when sso is on", () => {
		mockSettings.ssoUsersEnabled = true;
		const users = [makeUser("a@test.com", { isSso: true }), makeUser("b@test.com")];
		const { result } = render(users);

		expect(result.current.data.users).toEqual(users);
	});

	describe("query filter", () => {
		it("matches by email and by name", () => {
			const byEmail = makeUser("ivan@test.com");
			const byName = makeUser("x@test.com", { name: "Ivanov" });
			const { result } = render([byEmail, byName, makeUser("other@test.com")]);

			search(result, "IVAN");

			expect(result.current.data.users).toEqual([byEmail, byName]);
			expect(result.current.filter.query.value).toBe("IVAN");
		});
	});

	describe("type filter", () => {
		it("keeps editors only", () => {
			const editor = makeUser("a@test.com", { isEditor: true });
			const { result } = render([editor, makeUser("b@test.com")]);

			act(() => result.current.filter.type.set("editor"));

			expect(result.current.data.users).toEqual([editor]);
			expect(result.current.filter.type.selected).toBe("editor");
		});

		it("keeps workspace owners only", () => {
			const owner = makeUser("a@test.com", { isWorkspaceOwner: true });
			const { result } = render([owner, makeUser("b@test.com")]);

			act(() => result.current.filter.type.set("owner"));

			expect(result.current.data.users).toEqual([owner]);
		});
	});

	describe("sso search", () => {
		it("keeps the local flags and the locally stored email casing", async () => {
			mockSettings.ssoUsersEnabled = true;
			mockSettings.searchUsers.mockResolvedValue([{ email: "Ivan@test.com", name: "Ivan" }]);
			const local = makeUser("ivan@test.com", { isEditor: true, isWorkspaceOwner: true, isSso: true });
			const { result, onUsersLoad } = render([local]);

			search(result, "ivan");

			expect(result.current.data.isLoading).toBe(true);
			await waitFor(() => expect(result.current.data.isLoading).toBe(false));

			expect(mockSettings.searchUsers).toHaveBeenCalledWith("ivan");
			const found = [
				{ value: "ivan@test.com", name: "Ivan", isEditor: true, isWorkspaceOwner: true, isSso: true },
			];
			expect(result.current.data.users).toEqual(found);
			expect(onUsersLoad).toHaveBeenCalledWith(found);
		});

		it("marks an sso user unknown locally as a plain sso member", async () => {
			mockSettings.ssoUsersEnabled = true;
			mockSettings.searchUsers.mockResolvedValue([{ email: "new@test.com", name: "New" }]);
			const { result } = render([]);

			search(result, "new");
			await waitFor(() => expect(result.current.data.isLoading).toBe(false));

			expect(result.current.data.users).toEqual([
				{ value: "new@test.com", name: "New", isEditor: undefined, isWorkspaceOwner: undefined, isSso: true },
			]);
		});

		it("appends sso results to the matching local users", async () => {
			mockSettings.ssoUsersEnabled = true;
			mockSettings.searchUsers.mockResolvedValue([{ email: "ivan.sso@test.com", name: "Ivan Sso" }]);
			const local = makeUser("ivan.local@test.com", { isEditor: true });
			const { result } = render([local, makeUser("other@test.com")]);

			search(result, "ivan");
			await waitFor(() => expect(result.current.data.isLoading).toBe(false));

			expect(result.current.data.users).toEqual([
				local,
				{
					value: "ivan.sso@test.com",
					name: "Ivan Sso",
					isEditor: undefined,
					isWorkspaceOwner: undefined,
					isSso: true,
				},
			]);
		});

		it("falls back to local filtering when a type filter is set", async () => {
			mockSettings.ssoUsersEnabled = true;
			const editor = makeUser("ivan@test.com", { isEditor: true, isSso: true });
			const { result } = render([editor]);

			act(() => result.current.filter.type.set("editor"));
			search(result, "ivan");

			await waitFor(() => expect(result.current.data.users).toEqual([editor]));
			expect(mockSettings.searchUsers).not.toHaveBeenCalled();
		});

		it("does not search while sso is off", async () => {
			const local = makeUser("ivan@test.com");
			const { result } = render([local]);

			search(result, "ivan");

			await waitFor(() => expect(result.current.data.users).toEqual([local]));
			expect(mockSettings.searchUsers).not.toHaveBeenCalled();
		});

		it("stops loading and returns nothing when the search fails", async () => {
			mockSettings.ssoUsersEnabled = true;
			mockSettings.searchUsers.mockRejectedValue(new Error("sso down"));
			const { result } = render([]);

			search(result, "ivan");
			await waitFor(() => expect(result.current.data.isLoading).toBe(false));

			expect(result.current.data.users).toEqual([]);
		});
	});
});
