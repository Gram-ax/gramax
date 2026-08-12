import type { LevelName } from "@ext/settings/logic/settings";
import { FormField } from "@ui-kit/Form";
import type { ComponentProps } from "react";

import SettingResetButton from "./SettingResetButton";

type FormFieldProps = ComponentProps<typeof FormField>;

interface SettingFieldProps extends Omit<FormFieldProps, "labelSuffix"> {
	/** settings schema key used for reset; defaults to `name` (true at the app level) */
	settingKey?: string;
	resetLevel?: Extract<LevelName, "app" | "workspace">;
	/** show the per-field reset-to-default button (default: true) */
	withReset?: boolean;
}

/**
 * A `FormField` pre-wired with the per-field reset-to-default affordance. Sections
 * render this instead of `FormField` so adding a settings field needs no reset
 * boilerplate: the `rotate-ccw` button appears automatically when the value differs
 * from the schema default (and is hidden when readonly or `withReset={false}`).
 */
const SettingField = ({ settingKey, resetLevel = "app", withReset = true, name, ...rest }: SettingFieldProps) => {
	const key = settingKey ?? (name as string);
	return (
		<FormField
			{...rest}
			labelSuffix={
				withReset ? <SettingResetButton level={resetLevel} name={name as string} settingKey={key} /> : undefined
			}
			name={name}
		/>
	);
};

export default SettingField;
