import { TooltipArrow, TooltipContent as UiKitTooltipContent } from "ics-ui-kit/components/tooltip";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitTooltipContentProps = ExtractComponentGeneric<typeof UiKitTooltipContent>;

interface TooltipContentProps extends Omit<UiKitTooltipContentProps, "focus"> {
	focus?: "default" | "high";
}

export const TooltipContent = ({ children, focus = "high", ...otherProps }: TooltipContentProps) => {
	return (
		<UiKitTooltipContent {...otherProps} focus={focus === "high" ? "high" : undefined}>
			{children}
			<TooltipArrow />
		</UiKitTooltipContent>
	);
};
