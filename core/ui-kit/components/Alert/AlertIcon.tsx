import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { AlertIcon as UiKitAlertIcon } from "ics-ui-kit/components/alert";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

type UiKitAlertIconProps = ExtractComponentGeneric<typeof UiKitAlertIcon>;

interface AlertIconProps extends Omit<UiKitAlertIconProps, "icon"> {
	icon?: string;
}

export const AlertIcon: FC<AlertIconProps> = (props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitAlertIcon {...otherProps} icon={Icon as any} />;
};
