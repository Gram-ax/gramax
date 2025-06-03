import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { Button as UiKitButton } from "ics-ui-kit/components/button";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

type UiKitButtonProps = ExtractComponentGeneric<typeof UiKitButton>;

interface ButtonProps extends Omit<UiKitButtonProps, "startIcon" | "endIcon"> {
	startIcon?: string;
	endIcon?: string;
	shouldRender?: boolean;
}

export const Button: FC<ButtonProps> = (props) => {
	const { startIcon, endIcon, shouldRender = true, ...otherProps } = props;
	const StartIcon = startIcon && LucideIcon(startIcon);
	const EndIcon = endIcon && LucideIcon(endIcon);

	return (
		shouldRender && (
			<UiKitButton
				data-qa={"qa-clickable"}
				startIcon={StartIcon as any}
				endIcon={EndIcon as any}
				{...otherProps}
			/>
		)
	);
};
