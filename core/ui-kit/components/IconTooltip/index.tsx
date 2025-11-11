import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { IconTooltip as UiKitIconTooltip } from "ics-ui-kit/components/icon-tooltip";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitIconTooltipProps = ExtractComponentGeneric<typeof UiKitIconTooltip>;

interface IconTooltipProps extends Omit<UiKitIconTooltipProps, "icon"> {
	icon?: string;
	className?: string;
}

export const IconTooltip: FC<IconTooltipProps> = (props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitIconTooltip {...otherProps} icon={Icon as any} />;
};
