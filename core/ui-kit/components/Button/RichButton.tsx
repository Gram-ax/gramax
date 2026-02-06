import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { RichButton as UiKitRichButton } from "ics-ui-kit/components/button";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitRichButtonProps = ExtractComponentGeneric<typeof UiKitRichButton>;

export interface RichButtonProps extends Omit<UiKitRichButtonProps, "icon"> {
	icon?: string;
}

export const RichButton = forwardRef<HTMLButtonElement, RichButtonProps>((props, ref) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitRichButton data-qa={"qa-clickable"} icon={Icon as any} ref={ref} {...otherProps} />;
});
