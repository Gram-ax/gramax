import { SwitchField as UiKitSwitchField } from "ics-ui-kit/components/switch";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitSwitchFieldProps = ExtractComponentGeneric<typeof UiKitSwitchField>;

interface SwitchFieldProps extends Omit<UiKitSwitchFieldProps, "description"> {
	label?: JSX.Element;
	description?: JSX.Element;
}

export const SwitchField: FC<SwitchFieldProps> = (props) => {
	const { description, label, ...otherProps } = props;

	return <UiKitSwitchField {...otherProps} description={description as any} label={label as any} />;
};
