import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { IconButton as UiKitIconButton } from "ics-ui-kit/components/button";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitIconButtonProps = ExtractComponentGeneric<typeof UiKitIconButton>;

interface IconButtonProps extends Omit<UiKitIconButtonProps, "icon"> {
	icon: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
	const { icon, ...otherProps } = props;
	const lucideIcon = LucideIcon(icon);
	if (!lucideIcon) return null;
	return <UiKitIconButton icon={lucideIcon as any} ref={ref} {...otherProps} />;
});
