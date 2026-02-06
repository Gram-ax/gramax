import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import { Tooltip, TooltipContent, TooltipShortcut, TooltipTrigger } from "@ui-kit/Tooltip";
import { ToolbarToggleGroup, ToolbarToggleItem as UiKitToolbarToggleItem } from "ics-ui-kit/components/toolbar";
import { forwardRef, useCallback } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitToolbarToggleItemProps = ExtractComponentGeneric<typeof UiKitToolbarToggleItem>;

const StyledToolbarToggleItem = styled(UiKitToolbarToggleItem)`
	@media (pointer: fine) {
		&:hover,
		&[data-open="open"] {
			background-color: hsl(var(--inverse-hover));
		}
	}
`;

export interface ToolbarToggleButtonProps extends Omit<UiKitToolbarToggleItemProps, "value"> {
	active?: boolean;
	tooltipText?: string;
	hotKey?: string;
	focusable?: boolean;
}

export const ToolbarToggleButton = forwardRef<HTMLButtonElement, ToolbarToggleButtonProps>((props, ref) => {
	const { tooltipText, hotKey, active, focusable, onClick, onTouchStart, className, ...otherProps } = props;
	const state = active ? "on" : "off";

	// For don't lose focus in editor when clicking on toolbar toggle button
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (!focusable) e.preventDefault();
			onClick?.(e);
		},
		[onClick, focusable],
	);

	// For don't lose focus in editor when clicking on toolbar toggle button
	const handleTouchStart = useCallback(
		(e: React.TouchEvent<HTMLButtonElement>) => {
			if (!focusable) e.preventDefault();
			onTouchStart?.(e);
		},
		[onTouchStart, focusable],
	);

	const button = (
		<ToolbarToggleGroup type="single">
			<StyledToolbarToggleItem
				ref={ref}
				{...otherProps}
				className={cn(className, "p-1")}
				data-state={state}
				onClick={handleClick}
				onTouchStart={handleTouchStart}
				value="custom"
			/>
		</ToolbarToggleGroup>
	);

	if (!tooltipText && !hotKey) return button;

	return (
		<Tooltip>
			{(hotKey || tooltipText) && (
				<TooltipContent sideOffset={2}>
					<div className="flex items-center gap-2">
						{tooltipText}
						{hotKey && <TooltipShortcut className="p-0" inverse value={hotKey} />}
					</div>
				</TooltipContent>
			)}
			<TooltipTrigger asChild>{button}</TooltipTrigger>
		</Tooltip>
	);
});
