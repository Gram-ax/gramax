import { PlatformServiceNew } from "@core-ui/PlatformService";
import t from "@ext/localization/locale/translate";
import { AppSettings } from "@ext/settings/levels/app-settings";
import { extractDefaults, getByPath, isClientOverridable } from "@ext/settings/logic/schemaUtils";
import type { LevelName } from "@ext/settings/logic/settings";
import { Icon } from "@ui-kit/Icon";
import { useFormContext } from "react-hook-form";
import { useResetSettingsForm } from "./ResetSettingsFormContext";
import { isResettable } from "./settingResetVisible";

// Schema is static — extract the defaults tree once, not per render per field.
const SCHEMA_DEFAULTS = extractDefaults(AppSettings) as Record<string, unknown>;

interface SettingResetButtonProps {
	/** react-hook-form field path (e.g. "general.language" or "services.git-proxy.endpoint") */
	name: string;
	/** settings schema key, usually equal to `name` at the app level */
	settingKey: string;
	level?: LevelName;
}

const SettingResetButton = ({ name, settingKey }: SettingResetButtonProps) => {
	const form = useFormContext();
	const resetForm = useResetSettingsForm();
	const value = form.watch(name);

	// Hosted (docportal) non-overridable keys are read-only — no reset affordance.
	const readonly = PlatformServiceNew.isHostedSsr && !isClientOverridable(AppSettings, settingKey);
	if (readonly) return null;

	const defaultValue = getByPath(SCHEMA_DEFAULTS, settingKey);
	if (!isResettable(value, defaultValue)) return null;

	const onReset = () => {
		resetForm?.markReset(settingKey);
		form.setValue(name, defaultValue ?? "", {
			shouldDirty: true,
			shouldValidate: true,
		});
	};

	return (
		<button
			aria-label={t("app-settings.actions.reset-field")}
			className="inline-flex items-center text-muted hover:text-primary"
			onClick={onReset}
			title={t("app-settings.actions.reset-field")}
			type="button"
		>
			<Icon className="pl-1" icon="rotate-ccw" size="md" />
		</button>
	);
};

export default SettingResetButton;
