import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import SettingField from "@ext/settings/components/SettingField";
import type { AppSettingsFormData } from "@ext/settings/logic/formSchema";
import Theme from "@ext/Theme/Theme";
import { FormDivider } from "@ui-kit/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { SwitchField } from "@ui-kit/Switch";
import { type UseFormReturn, useWatch } from "react-hook-form";

type Props = { form: UseFormReturn<AppSettingsFormData> };

const GeneralSection = ({ form }: Props) => {
	const compressEnabled = useWatch({ control: form.control, name: "compress-images.enabled" }) ?? false;

	return (
		<SectionContainer>
			<SettingField
				control={({ field }) => (
					<Select onValueChange={field.onChange} value={field.value}>
						<SelectTrigger>
							<SelectValue placeholder={t("app-settings.general.language.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={UiLanguage.en}>{t("app-settings.general.language.en")}</SelectItem>
							<SelectItem value={UiLanguage.ru}>{t("app-settings.general.language.ru")}</SelectItem>
						</SelectContent>
					</Select>
				)}
				labelClassName="w-max"
				layout="vertical"
				name="general.language"
				title={t("app-settings.general.language.title")}
			/>
			<SettingField
				control={({ field }) => (
					<Select onValueChange={field.onChange} value={field.value}>
						<SelectTrigger>
							<SelectValue placeholder={t("app-settings.general.theme.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={Theme.light}>{t("app-settings.general.theme.light")}</SelectItem>
							<SelectItem value={Theme.dark}>{t("app-settings.general.theme.dark")}</SelectItem>
						</SelectContent>
					</Select>
				)}
				labelClassName="w-max"
				layout="vertical"
				name="general.theme"
				title={t("app-settings.general.theme.title")}
			/>
			<FormDivider />
			<SwitchField
				alignment="left"
				checked={compressEnabled}
				description={t("app-settings.compress-images.enabled-description")}
				label={t("app-settings.compress-images.enabled")}
				onCheckedChange={(value) => form.setValue("compress-images.enabled", value, { shouldDirty: true })}
				size="sm"
			/>
		</SectionContainer>
	);
};

export default GeneralSection;
