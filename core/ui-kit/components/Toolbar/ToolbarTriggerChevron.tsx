import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import { ToolbarTriggerChevron as UiKitToolbarTriggerChevron } from "ics-ui-kit/components/toolbar";
import { forwardRef, useCallback } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitToolbarTriggerChevronProps = ExtractComponentGeneric<typeof UiKitToolbarTriggerChevron> & {
	focusable?: boolean;
	active?: boolean;
};

const StyledToolbarTriggerChevron = styled(UiKitToolbarTriggerChevron)`
	@media (pointer: fine) {
		&:hover,
		&[aria-selected="true"] {
			background-color: hsl(var(--inverse-hover));
		}
	}
`;

export const ToolbarTriggerChevron = forwardRef<HTMLButtonElement, UiKitToolbarTriggerChevronProps>((props, ref) => {
	const { className, focusable, active, onClick, onMouseDown, ...otherProps } = props;

	// For don't lose focus in editor when clicking on toolbar toggle button
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (!focusable) e.preventDefault();
			onClick?.(e);
		},
		[onClick, focusable],
	);

	// For don't lose focus in editor when touching on toolbar toggle button
	// mousedown fires before focus transfer and is not passive, unlike touchstart
	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (!focusable) e.preventDefault();
			onMouseDown?.(e);
		},
		[onMouseDown, focusable],
	);

	return (
		<StyledToolbarTriggerChevron
			aria-selected={active}
			className={cn("py-1.5 disabled:opacity-50 disabled:pointer-events-none", className)}
			onClick={handleClick}
			onMouseDown={handleMouseDown}
			ref={ref}
			{...otherProps}
		/>
	);
});
