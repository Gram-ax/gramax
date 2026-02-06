import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { ToolbarIcon as UiKitToolbarIcon } from "ics-ui-kit/components/toolbar";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitToolbarIconProps = ExtractComponentGeneric<typeof UiKitToolbarIcon>;

export interface ToolbarIconProps extends Omit<UiKitToolbarIconProps, "icon"> {
	icon?: string;
}

export const ToolbarIcon = forwardRef<SVGSVGElement, ToolbarIconProps>((props, ref) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && typeof icon === "string" && LucideIcon(icon);
	if (!Icon) return null;

	return <UiKitToolbarIcon icon={Icon as any} ref={ref} {...otherProps} />;
});
