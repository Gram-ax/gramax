import { Icon } from "@ui-kit/Icon";
import t from "@ext/localization/locale/translate";
import { cn } from "@core-ui/utils/cn";
import { CSSProperties } from "react";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";

interface SelectDisableItemProps {
	text: string;
	isDisabled: boolean;
	isSelected: boolean;
	className?: string;
	style?: CSSProperties;
}

export const SelectDisableItem = ({ text, isDisabled, isSelected, className, style }: SelectDisableItemProps) => {
	return (
		<div className={cn("flex items-center justify-between w-full", className)} style={style}>
			<TextOverflowTooltip className="max-w-full truncate w-full">{text}</TextOverflowTooltip>
			{isDisabled ? <span className="text-muted text-xs">{t("already-added").toLowerCase()}</span> : ""}
			{isSelected && <Icon icon="check" className="ml-auto" />}
		</div>
	);
};
