import type { SettingsTab } from "@ext/catalog/actions/propsEditor/components/Sections";
import { EditAdvancedProps } from "@ext/catalog/actions/propsEditor/components/Sections/Advanced";
import { type BasicProps, EditBasicProps } from "@ext/catalog/actions/propsEditor/components/Sections/Basic";
import { EditIconsProps } from "@ext/catalog/actions/propsEditor/components/Sections/Icons";
import { EditLanguageAndVersionsProps } from "@ext/catalog/actions/propsEditor/components/Sections/LanguageAndVersions";
import { EditStorageProps } from "@ext/catalog/actions/propsEditor/components/Sections/Storage";
import type { FormData, FormProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import type { UseFormReturn } from "react-hook-form";
import { EditLfsProps } from "./Lfs";
import { StorageUsage } from "./StorageUsage";

interface SectionComponentProps {
	activeTab: SettingsTab;
	formProps: FormProps;
	form: UseFormReturn<FormData>;
}

const getSectionComponentByTab = (activeTab: SettingsTab) => {
	const components: Record<SettingsTab, React.ComponentType<BasicProps>> = {
		general: EditBasicProps,
		storage: EditStorageProps,
		language: EditLanguageAndVersionsProps,
		icons: EditIconsProps,
		advanced: EditAdvancedProps,
		storageUsage: StorageUsage as React.ComponentType<BasicProps>,
		lfs: EditLfsProps,
	};

	return components[activeTab];
};

export const SectionComponent = ({ activeTab, ...props }: SectionComponentProps) => {
	const Component = getSectionComponentByTab(activeTab);
	if (!Component) return null;
	return <Component {...props} />;
};
