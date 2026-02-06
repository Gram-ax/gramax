import { cn } from "@core-ui/utils/cn";
import { Tooltip, TooltipContent, TooltipShortcut, TooltipTrigger } from "@ui-kit/Tooltip";
import { ToolbarToggleItem as UiKitToolbarToggleItem } from "ics-ui-kit/components/toolbar";
import { forwardRef, useCallback } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitToolbarToggleItemProps = ExtractComponentGeneric<typeof UiKitToolbarToggleItem>;

export interface ToolbarToggleItemProps extends UiKitToolbarToggleItemProps {
	active?: boolean;
	tooltipText?: string;
	hotKey?: string;
}

export const ToolbarToggleItem = forwardRef<HTMLButtonElement, ToolbarToggleItemProps>((props, ref) => {
	const { tooltipText, hotKey, active, onClick, onTouchStart, className, ...otherProps } = props;
	const state = active ? "on" : "off";

	// For don't lose focus in editor when clicking on toolbar toggle button
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			onClick?.(e);
		},
		[onClick],
	);

	// For don't lose focus in editor when clicking on toolbar toggle button
	const handleTouchStart = useCallback(
		(e: React.TouchEvent<HTMLButtonElement>) => {
			e.preventDefault();
			onTouchStart?.(e);
		},
		[onTouchStart],
	);

	return (
		<Tooltip>
			{(tooltipText || hotKey) && (
				<TooltipContent sideOffset={2}>
					<div className="flex items-center gap-2">
						{tooltipText}
						{hotKey && <TooltipShortcut className="p-0" inverse value={hotKey} />}
					</div>
				</TooltipContent>
			)}
			<TooltipTrigger asChild>
				<UiKitToolbarToggleItem
					ref={ref}
					{...otherProps}
					className={cn(className, "p-1")}
					data-state={state}
					onClick={handleClick}
					onTouchStart={handleTouchStart}
				/>
			</TooltipTrigger>
		</Tooltip>
	);
});
