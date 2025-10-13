import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { ExtractComponentGeneric } from "core/ui-kit/lib/extractComponentGeneric";
import { Badge as UiKitBadge } from "ics-ui-kit/components/badge";

type UiKitBadgeProps = ExtractComponentGeneric<typeof UiKitBadge>;

export interface BadgeProps extends Omit<UiKitBadgeProps, "startIcon" | "endIcon"> {
	startIcon?: string;
	endIcon?: string;
}

export const Badge = ({ startIcon, endIcon, ...otherProps }: BadgeProps) => {
	const StartIcon = startIcon && LucideIcon(startIcon);
	const EndIcon = endIcon && LucideIcon(endIcon);

	return <UiKitBadge startIcon={StartIcon as any} endIcon={EndIcon as any} {...otherProps} />;
};
