import type { GroupMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import type { searchGroupInfo } from "@ext/enterprise/EnterpriseService";
import { act, renderHook, waitFor } from "@testing-library/react";
import { makeAggregate, makeGroup } from "../../../__tests__/fixtures";
import { useGroupList } from "../useGroupList";

const mockSettings = {
	ssoGroupsEnabled: false,
	searchGroups: jest.fn<Promise<searchGroupInfo[]>, [string]>(),
};

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => mockSettings,
}));

const render = (groups: GroupMember[], enabled = true) => {
	const onGroupsLoad = jest.fn();
	const aggregate = makeAggregate({ groups });
	const result = renderHook(() => useGroupList({ aggregate, enabled, onGroupsLoad }));
	return { ...result, onGroupsLoad };
};

const search = (result: { current: ReturnType<typeof useGroupList> }, query: string) =>
	act(() => result.current.filter.query.set(query));

beforeEach(() => {
	mockSettings.ssoGroupsEnabled = false;
	mockSettings.searchGroups.mockReset();
});

describe("useGroupList", () => {
	it("returns every local group", () => {
		const groups = [makeGroup("dev"), makeGroup("qa")];
		const { result, onGroupsLoad } = render(groups);

		expect(result.current.data).toEqual({ groups, isLoading: false });
		expect(onGroupsLoad).toHaveBeenCalledWith(groups);
	});

	it("returns nothing while disabled", () => {
		const { result, onGroupsLoad } = render([makeGroup("dev")], false);

		expect(result.current.data).toEqual({ groups: [], isLoading: false });
		expect(onGroupsLoad).not.toHaveBeenCalled();
	});

	describe("query filter", () => {
		it("matches by id and by name", () => {
			const byId = makeGroup("devops");
			const byName = makeGroup("g1", { name: "DevOps team" });
			const { result } = render([byId, byName, makeGroup("qa")]);

			search(result, "DEV");

			expect(result.current.data.groups).toEqual([byId, byName]);
			expect(result.current.filter.query.value).toBe("DEV");
		});
	});

	describe("type filter", () => {
		it("keeps workspace owners only", () => {
			const owner = makeGroup("dev", { isWorkspaceOwner: true });
			const { result } = render([owner, makeGroup("qa")]);

			act(() => result.current.filter.type.set("owner"));

			expect(result.current.data.groups).toEqual([owner]);
			expect(result.current.filter.type.selected).toBe("owner");
		});
	});

	describe("sso search", () => {
		it("appends sso groups that are not present locally", async () => {
			mockSettings.ssoGroupsEnabled = true;
			mockSettings.searchGroups.mockResolvedValue([{ id: "sso-dev", name: "Sso Dev" }]);
			const local = makeGroup("dev");
			const { result, onGroupsLoad } = render([local]);

			search(result, "dev");

			expect(result.current.data.isLoading).toBe(true);
			await waitFor(() => expect(result.current.data.isLoading).toBe(false));

			expect(mockSettings.searchGroups).toHaveBeenCalledWith("dev");
			const found = [
				local,
				{
					id: "sso-dev",
					name: "Sso Dev",
					source: GroupSource.SSO_GROUPS,
					isWorkspaceOwner: undefined,
					isSystem: false,
				},
			];
			expect(result.current.data.groups).toEqual(found);
			expect(onGroupsLoad).toHaveBeenLastCalledWith(found);
		});

		it("keeps the local entry when the same group comes from sso", async () => {
			mockSettings.ssoGroupsEnabled = true;
			mockSettings.searchGroups.mockResolvedValue([{ id: "dev", name: "Sso Dev" }]);
			const local = makeGroup("dev", { isWorkspaceOwner: true });
			const { result } = render([local]);

			search(result, "dev");
			await waitFor(() => expect(result.current.data.isLoading).toBe(false));

			expect(result.current.data.groups).toEqual([local]);
		});

		it("falls back to local filtering when a type filter is set", async () => {
			mockSettings.ssoGroupsEnabled = true;
			const owner = makeGroup("dev", { isWorkspaceOwner: true });
			const { result } = render([owner]);

			act(() => result.current.filter.type.set("owner"));
			search(result, "dev");

			await waitFor(() => expect(result.current.data.groups).toEqual([owner]));
			expect(mockSettings.searchGroups).not.toHaveBeenCalled();
		});

		it("does not search while sso is off", async () => {
			const local = makeGroup("dev");
			const { result } = render([local]);

			search(result, "dev");

			await waitFor(() => expect(result.current.data.groups).toEqual([local]));
			expect(mockSettings.searchGroups).not.toHaveBeenCalled();
		});

		it("keeps local groups when the search fails", async () => {
			mockSettings.ssoGroupsEnabled = true;
			mockSettings.searchGroups.mockRejectedValue(new Error("sso down"));
			const local = makeGroup("dev");
			const { result } = render([local]);

			search(result, "dev");
			await waitFor(() => expect(result.current.data.isLoading).toBe(false));

			expect(result.current.data.groups).toEqual([local]);
		});
	});
});
