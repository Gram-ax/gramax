import { TooltipArrow, TooltipContent as UiKitTooltipContent } from "ics-ui-kit/components/tooltip";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitTooltipContentProps = ExtractComponentGeneric<typeof UiKitTooltipContent>;

interface TooltipContentProps extends Omit<UiKitTooltipContentProps, "focus"> {
	focus?: "default" | "high";
}

export const TooltipContent = (props: TooltipContentProps) => {
	const { children, focus = "high", style = { maxWidth: "20rem" }, ...otherProps } = props;
	return (
		<UiKitTooltipContent {...otherProps} focus={focus === "high" ? "high" : undefined} style={style}>
			{children}
			<TooltipArrow />
		</UiKitTooltipContent>
	);
};
