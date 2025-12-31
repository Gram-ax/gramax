import { SettingsTab } from "@ext/catalog/actions/propsEditor/components/Sections";
import { EditAppearanceProps } from "@ext/catalog/actions/propsEditor/components/Sections/Appearance";
import { BasicProps, EditBasicProps } from "@ext/catalog/actions/propsEditor/components/Sections/Basic";
import { EditIconsProps } from "@ext/catalog/actions/propsEditor/components/Sections/Icons";
import { FormData, FormProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import { UseFormReturn } from "react-hook-form";
import { EditLfsProps } from "./Lfs";

interface SectionComponentProps {
	activeTab: SettingsTab;
	formProps: FormProps;
	form: UseFormReturn<FormData>;
}

const getSectionComponentByTab = (activeTab: SettingsTab) => {
	const components: Record<SettingsTab, React.ComponentType<BasicProps>> = {
		general: EditBasicProps,
		appearance: EditAppearanceProps,
		icons: EditIconsProps,
		lfs: EditLfsProps,
	};

	return components[activeTab];
};

export const SectionComponent = ({ activeTab, ...props }: SectionComponentProps) => {
	const Component = getSectionComponentByTab(activeTab);
	return <Component {...props} />;
};
