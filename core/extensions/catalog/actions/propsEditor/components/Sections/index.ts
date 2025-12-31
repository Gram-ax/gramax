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
	lfs: {
		icon: "package",
		label: "lfs",
	},
};

export type SettingsTab = keyof typeof SettingsTabs;

export { SectionComponent } from "./SectionComponent";
