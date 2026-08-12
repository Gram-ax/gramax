import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { Badge as UiKitBadge } from "ics-ui-kit/components/badge";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitBadgeProps = ExtractComponentGeneric<typeof UiKitBadge>;

export interface BadgeProps extends Omit<UiKitBadgeProps, "startIcon" | "endIcon"> {
	startIcon?: string;
	endIcon?: string;
}

export const Badge = ({ startIcon, endIcon, ...otherProps }: BadgeProps) => {
	const StartIcon = startIcon && LucideIcon(startIcon);
	const EndIcon = endIcon && LucideIcon(endIcon);

	// biome-ignore-start lint/suspicious/noExplicitAny: icon component type mismatch between Lucide and ui-kit
	return <UiKitBadge endIcon={EndIcon as any} startIcon={StartIcon as any} {...otherProps} />;
	// biome-ignore-end lint/suspicious/noExplicitAny: icon component type mismatch between Lucide and ui-kit
};
