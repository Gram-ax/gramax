import { cn } from "@core-ui/utils/cn";
import { Icon } from "@ui-kit/Icon";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import type { CSSProperties } from "react";
import { GroupTypeBadge } from "./GroupTypeBadge";
import type { GroupSelectOption } from "./useGroups";

interface GroupSelectItemProps {
	option: GroupSelectOption;
	isDisabled: boolean;
	isSelected: boolean;
	className?: string;
	style?: CSSProperties;
}

export const GroupSelectItem = ({ option, isDisabled, isSelected, className, style }: GroupSelectItemProps) => {
	return (
		<div className={cn("flex items-center gap-2 w-full min-w-0", className)} style={style}>
			<TextOverflowTooltip className="min-w-0 flex-1 truncate">{option.label}</TextOverflowTooltip>
			{isSelected || isDisabled ? <Icon className="shrink-0 ml-auto" icon="check" /> : null}
			<GroupTypeBadge group={{ id: String(option.value), source: option.source }} />
		</div>
	);
};
