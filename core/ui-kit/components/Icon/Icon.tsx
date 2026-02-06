import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { Icon as UiKitIcon } from "ics-ui-kit/components/icon";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitIconProps = ExtractComponentGeneric<typeof UiKitIcon>;

export interface IconProps extends Omit<UiKitIconProps, "icon"> {
	icon: string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && typeof icon === "string" && LucideIcon(icon);
	if (!Icon) return null;

	return <UiKitIcon icon={Icon as any} ref={ref} {...otherProps} />;
});
