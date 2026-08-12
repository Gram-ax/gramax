/** biome-ignore-all lint/style/useNamingConvention: test globals */
import { act, renderHook } from "@testing-library/react";

const calls: string[] = [];

jest.mock("@core-ui/ApiServices/FetchService", () => ({
	__esModule: true,
	default: {
		fetch: jest.fn(async () => {
			calls.push("fetch");
		}),
	},
}));

jest.mock("@core-ui/ContextServices/ApiUrlCreator", () => ({
	__esModule: true,
	default: { value: { removeWorkspace: jest.fn(() => "remove-url") } },
}));

jest.mock("@core-ui/ContextServices/Workspace", () => ({
	__esModule: true,
	default: { workspaces: jest.fn(() => []), defaultPath: jest.fn(() => "path") },
}));

jest.mock("@core-ui/utils/initGlobalFuncs", () => ({
	__esModule: true,
	clearData: jest.fn(),
}));

jest.mock("@ext/localization/locale/translate", () => ({
	__esModule: true,
	default: (key: string) => key,
}));

jest.mock("@ext/workspace/components/useWorkspaceLogo", () => ({
	useWorkspaceLogo: () => ({ confirmChanges: jest.fn(), haveChanges: false }),
}));

jest.mock("@ext/workspace/components/useWorkspaceStyle", () => ({
	useWorkspaceStyle: () => ({ confirmChanges: jest.fn(), haveChanges: false }),
}));

import { useWorkspaceEditorActions } from "./useWorkspaceEditorActions";

describe("useWorkspaceEditorActions.removeWorkspace", () => {
	beforeEach(() => {
		calls.length = 0;
		(globalThis as unknown as { confirm: unknown }).confirm = jest.fn(() => true);
		(globalThis as unknown as { refreshPage: unknown }).refreshPage = jest.fn(async () => {
			calls.push("refreshPage");
		});
	});

	// The delete flow reloads page data, which switches the app to the next
	// workspace. If the modal is still open when that happens, it re-renders on
	// the next workspace instead of closing (GitHub discussion 2026-07-23). The
	// modal must be dismissed before the page refresh switches workspaces.
	it("closes the modal before refreshing the page", async () => {
		const { result } = renderHook(() => useWorkspaceEditorActions({ path: "ws-1", name: "WS 1" } as never));
		const close = jest.fn(() => {
			calls.push("close");
		});

		await act(async () => {
			await result.current.removeWorkspace(close);
		});

		expect(close).toHaveBeenCalledTimes(1);
		expect(calls.indexOf("close")).toBeGreaterThanOrEqual(0);
		expect(calls.indexOf("close")).toBeLessThan(calls.indexOf("refreshPage"));
	});
});
