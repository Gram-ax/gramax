export { EditAppearanceProps as EditDisplayProps } from "./Appearance";
export { EditBasicProps } from "./Basic";

export const SettingsTabs = {
	general: {
		icon: "settings",
		label: "general",
	},
	appearance: {
		icon: "id-card",
		label: "appearance",
	},
	icons: {
		icon: "images",
		label: "icons",
	},
};

export const GitSettingsTabs = {
	lfs: {
		icon: "package",
		label: "lfs",
	},
	storageUsage: {
		icon: "hard-drive",
		label: "storage-usage",
	},
};

export type SettingsTab = keyof typeof SettingsTabs | keyof typeof GitSettingsTabs;

export { SectionComponent } from "./SectionComponent";
