import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { IconButton as UiKitIconButton } from "ics-ui-kit/components/button";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { forwardRef } from "react";

type UiKitIconButtonProps = ExtractComponentGeneric<typeof UiKitIconButton>;

interface IconButtonProps extends Omit<UiKitIconButtonProps, "icon"> {
	icon: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
	const { icon, ...otherProps } = props;
	const lucideIcon = LucideIcon(icon);

	return <UiKitIconButton ref={ref} icon={lucideIcon as any} {...otherProps} />;
});
