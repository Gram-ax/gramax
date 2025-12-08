import { RichButton as UiKitRichButton } from "ics-ui-kit/components/button";
import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { forwardRef } from "react";

type UiKitRichButtonProps = ExtractComponentGeneric<typeof UiKitRichButton>;

export interface RichButtonProps extends Omit<UiKitRichButtonProps, "icon"> {
	icon?: string;
}

export const RichButton = forwardRef<HTMLButtonElement, RichButtonProps>((props, ref) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitRichButton ref={ref} data-qa={"qa-clickable"} icon={Icon as any} {...otherProps} />;
});
