import { usePlatform } from "@core-ui/hooks/usePlatform";
import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import t from "@ext/localization/locale/translate";
import SettingField from "@ext/settings/components/SettingField";
import { AppSettings } from "@ext/settings/levels/app-settings";
import { getSchemaEntry } from "@ext/settings/logic/schemaUtils";
import { ENVIRONMENT_TARGET, Target } from "@ext/settings/logic/settings";
import { Input } from "@ui-kit/Input";

export const SERVICE_FIELDS = [
	{ key: "web-editor", placeholder: "https://app.gram.ax" },
	{ key: "auth", placeholder: "https://gram.ax/auth" },
	{
		key: "diagram-renderer",
		placeholder: "https://app.gram.ax/diagram-renderer",
	},
	{ key: "git-proxy", placeholder: "https://develop.gram.ax/git-proxy" },
] as const;

const labelClass = "w-72 max-w-full";

const ServicesSection = ({
	prefix = "services",
	showReset = false,
	disabled = false,
}: {
	prefix?: string;
	showReset?: boolean;
	disabled?: boolean;
}) => {
	const { environment } = usePlatform();
	const target = ENVIRONMENT_TARGET[environment] ?? Target.all;

	return (
		<SectionContainer>
			{SERVICE_FIELDS.filter(({ key }) => {
				const entry = getSchemaEntry(AppSettings, `services.${key}.endpoint`);
				return entry ? (entry.target & target) !== 0 : true;
			}).map(({ key, placeholder }) => (
				<SettingField
					control={({ field }) => (
						<Input
							className="w-full"
							disabled={disabled}
							placeholder={placeholder}
							{...field}
							value={field.value ?? ""}
						/>
					)}
					description={t(`app-settings.services.${key}.description` as Parameters<typeof t>[0])}
					key={key}
					labelClassName={labelClass}
					layout="vertical"
					name={`${prefix}.${key}.endpoint`}
					settingKey={`services.${key}.endpoint`}
					title={t(`app-settings.services.${key}.title` as Parameters<typeof t>[0])}
					withReset={showReset}
				/>
			))}
		</SectionContainer>
	);
};

export default ServicesSection;
