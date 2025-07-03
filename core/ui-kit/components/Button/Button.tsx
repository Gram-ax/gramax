import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { Button as UiKitButton } from "ics-ui-kit/components/button";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { forwardRef } from "react";

type UiKitButtonProps = ExtractComponentGeneric<typeof UiKitButton>;

export interface ButtonProps extends Omit<UiKitButtonProps, "startIcon" | "endIcon"> {
	startIcon?: string;
	endIcon?: string;
	shouldRender?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	const { startIcon, endIcon, shouldRender = true, ...otherProps } = props;
	const StartIcon = startIcon && LucideIcon(startIcon);
	const EndIcon = endIcon && LucideIcon(endIcon);

	return (
		shouldRender && (
			<UiKitButton
				ref={ref}
				data-qa={"qa-clickable"}
				startIcon={StartIcon as any}
				endIcon={EndIcon as any}
				{...otherProps}
			/>
		)
	);
});
