import LucideIcon, { type IconCode } from "@components/Atoms/Icon/LucideIcon";
import { Button as UiKitButton } from "ics-ui-kit/components/button";
import { forwardRef } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

export type UiKitButtonProps = ExtractComponentGeneric<typeof UiKitButton>;

export interface ButtonProps extends Omit<UiKitButtonProps, "startIcon" | "endIcon"> {
	startIcon?: IconCode;
	endIcon?: IconCode;
	shouldRender?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	const { startIcon, endIcon, shouldRender = true, ...otherProps } = props;
	const StartIcon = startIcon && LucideIcon(startIcon);
	const EndIcon = endIcon && LucideIcon(endIcon);

	return (
		shouldRender && (
			<UiKitButton data-qa={"qa-clickable"} endIcon={EndIcon} ref={ref} startIcon={StartIcon} {...otherProps} />
		)
	);
});
