import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { AlertDialogIcon as UiKitAlertDialogIcon } from "ics-ui-kit/components/alert-dialog";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

type UiKitAlertDialogIconProps = ExtractComponentGeneric<typeof UiKitAlertDialogIcon>;

interface AlertDialogIconProps extends Omit<UiKitAlertDialogIconProps, "icon"> {
	icon?: string;
}

export const AlertDialogIcon: FC<AlertDialogIconProps> = (props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitAlertDialogIcon {...otherProps} icon={Icon as any} />;
};
