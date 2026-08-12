import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import AppSettingsEditor from "./AppSettingsEditor";

const mockResetSettings = jest.fn();
const mockUpdateSettings = jest.fn();

jest.mock("@core-ui/ContextServices/Workspace", () => ({
	// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
	__esModule: true,
	default: { current: jest.fn(() => null) },
}));

jest.mock("@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider", () => ({
	useCatalogPropsStore: (selector: (state: { data: null }) => unknown) => selector({ data: null }),
}));

jest.mock("@core-ui/utils/initGlobalFuncs", () => ({
	refreshPage: jest.fn(),
}));

jest.mock("zustand", () => ({
	...jest.requireActual("zustand"),
	useStore: (store: { getState: () => unknown }, selector: (state: unknown) => unknown) => selector(store.getState()),
}));

jest.mock("@ext/settings/logic/cachedSettingsStore", () => ({
	cachedSettingsStore: (() => {
		// The app-level form reads `appValues` (see AppSettingsEditor: useStore(..., s => s.appValues)).
		const settings = {
			general: { language: "en", theme: "dark" },
			services: {},
			"compress-images": { enabled: false, rules: [] },
		};
		const state = { values: settings, appValues: settings };
		return {
			getState: () => state,
		};
	})(),
}));

jest.mock("@ext/settings/logic/hooks", () => ({
	useResetSettings: () => mockResetSettings,
	useUpdateSettings: () => mockUpdateSettings,
}));

jest.mock("@ext/settings/logic/schemaUtils", () => ({
	extractDefaults: () => ({ general: { language: "ru", theme: "light" }, services: {} }),
	getByPath: (obj: Record<string, unknown>, path: string) =>
		path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], obj),
	isClientOverridable: () => true,
}));

jest.mock("@core-ui/PlatformService", () => ({
	PlatformServiceNew: { isHostedSsr: false },
}));

jest.mock("@ext/localization/locale/translate", () => ({
	// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
	__esModule: true,
	default: (key: string) => key,
}));

jest.mock("@ext/toggleFeatures/features", () => ({
	currentFeatureTarget: () => 1 << 1,
	feature: () => true,
	FeatureTarget: () => ({
		none: 0,
		web: 1 << 0,
		desktop: 1 << 1,
		docportal: 1 << 2,
		static: 1 << 3,
		all: (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3),
	}),
}));

jest.mock("@ui-kit/Dialog", () => ({
	Dialog: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	DialogBody: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	DialogContent: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
}));

jest.mock("@ui-kit/Form", () => ({
	Form: ({ children }: { children: ReactNode }) =>
		require("react").createElement(require("react").Fragment, null, children),
	FormBody: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	FormDivider: () => null,
	FormFooter: () => null,
	FormHeader: () => null,
	FormStack: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	FormField: ({ labelSuffix }: { labelSuffix?: ReactNode }) =>
		require("react").createElement("div", null, labelSuffix),
}));

jest.mock("@ui-kit/Select", () => ({
	Select: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SelectContent: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SelectItem: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SelectTrigger: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SelectValue: () => null,
}));

jest.mock("@ui-kit/Icon", () => ({
	Icon: () => null,
}));

jest.mock("@ui-kit/Button", () => ({
	Button: ({ children }: { children: ReactNode }) =>
		require("react").createElement("button", { type: "button" }, children),
}));

jest.mock("@ui-kit/Loader", () => ({
	Loader: () => null,
}));

jest.mock("@ui-kit/Sidebar", () => ({
	Sidebar: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SidebarContent: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SidebarGroup: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SidebarGroupContent: ({ children }: { children: ReactNode }) =>
		require("react").createElement("div", null, children),
	SidebarGroupLabel: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SidebarMenu: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SidebarMenuButton: ({ children }: { children: ReactNode }) =>
		require("react").createElement("button", { type: "button" }, children),
	SidebarMenuItem: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SidebarProvider: ({ children }: { children: ReactNode }) => require("react").createElement("div", null, children),
	SidebarSeparator: () => null,
}));

jest.mock("@ext/enterprise/components/admin/ui-kit/ConfirmationDialog", () => ({
	ConfirmationDialog: () => null,
}));

jest.mock("@ext/errorHandlers/client/components/ModalErrorHandler", () => ({
	// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
	__esModule: true,
	default: ({ children }: { children: ReactNode }) =>
		require("react").createElement(require("react").Fragment, null, children),
}));

jest.mock("@ext/catalog/actions/propsEditor/components/CatalogPropsEditorBody", () => ({
	// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
	__esModule: true,
	default: () => null,
}));

jest.mock("@ext/workspace/components/EditWorkspaceFormBody", () => ({
	// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
	__esModule: true,
	WORKSPACE_TABS: {},
	default: () => null,
}));

jest.mock("@ext/catalog/actions/propsEditor/components/Sections", () => ({
	GitSettingsTabs: {},
	SettingsTabs: {},
}));

describe("AppSettingsEditor", () => {
	it("provides react-hook-form context for setting reset buttons", () => {
		expect(() => render(require("react").createElement(AppSettingsEditor))).not.toThrow();
	});

	it("applies field reset to the form without persisting immediately", () => {
		render(require("react").createElement(AppSettingsEditor));

		fireEvent.click(screen.getAllByLabelText("app-settings.actions.reset-field")[0]);

		expect(mockResetSettings).not.toHaveBeenCalled();
		expect(mockUpdateSettings).not.toHaveBeenCalled();
	});
});
