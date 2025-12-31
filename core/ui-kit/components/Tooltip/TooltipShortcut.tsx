import { useResolveShortcut } from "@core-ui/hooks/useResolveShortcut";
import { cn } from "@core-ui/utils/cn";
import { ExtractComponentGeneric } from "core/ui-kit/lib/extractComponentGeneric";
import { TooltipShortcut as UiKitTooltipShortcut } from "ics-ui-kit/components/tooltip";

type UiKitTooltipShortcutProps = ExtractComponentGeneric<typeof UiKitTooltipShortcut>;

export interface TooltipShortcutProps extends Omit<UiKitTooltipShortcutProps, "children"> {
	value: string;
	inverse?: boolean;
}

export const TooltipShortcut = ({ value, inverse, className, ...otherProps }: TooltipShortcutProps) => {
	const keys = useResolveShortcut(value);

	return (
		<UiKitTooltipShortcut {...otherProps} className={cn(className, inverse && "text-inverse-secondary-fg")}>
			{keys}
		</UiKitTooltipShortcut>
	);
};
