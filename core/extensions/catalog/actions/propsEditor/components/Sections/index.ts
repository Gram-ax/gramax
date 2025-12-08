export { EditBasicProps } from "./Basic";
export { EditAppearanceProps as EditDisplayProps } from "./Appearance";

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

export type SettingsTab = keyof typeof SettingsTabs;

export { SectionComponent } from "./SectionComponent";
