import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { Button as UiKitButton } from "ics-ui-kit/components/button";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

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
				data-qa={"qa-clickable"}
				endIcon={EndIcon as any}
				ref={ref}
				startIcon={StartIcon as any}
				{...otherProps}
			/>
		)
	);
});
