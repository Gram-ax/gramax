import type { SidebarItem } from "@ext/settings/components/AppSettingsSidebarTabsRenderer";

export { EditBasicProps as EditDisplayProps } from "./Basic";

export const SettingsTabs = {
	general: {
		type: "button",
		key: "general",
		icon: "settings",
		label: "settings-2",
	},
	storage: {
		icon: "folder-git-2",
		label: "storage",
		type: "button",
		key: "storage",
	},
	language: {
		icon: "languages",
		label: "language",
		type: "button",
		key: "language",
	},
	icons: {
		icon: "shapes",
		label: "icons",
		type: "button",
		key: "icons",
	},
	advanced: {
		icon: "wrench",
		label: "advanced",
		type: "button",
		key: "advanced",
	},
} satisfies Record<string, SidebarItem>;

export const GitSettingsTabs = {
	lfs: {
		type: "button",
		key: "lfs",
		icon: "package",
		label: "lfs",
	},
	storageUsage: {
		type: "button",
		key: "storageUsage",
		icon: "hard-drive",
		label: "storage-usage",
	},
} satisfies Record<string, SidebarItem>;

export type SettingsTab = keyof typeof SettingsTabs | keyof typeof GitSettingsTabs;

export { SectionComponent } from "./SectionComponent";
