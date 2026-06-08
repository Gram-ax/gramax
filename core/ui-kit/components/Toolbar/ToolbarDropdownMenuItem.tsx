import { cn } from "@core-ui/utils/cn";
import { DropdownMenuItem, DropdownMenuShortcut } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Children, forwardRef, isValidElement } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type DropdownMenuItemProps = ExtractComponentGeneric<typeof DropdownMenuItem>;

export interface ToolbarDropdownMenuItemProps extends DropdownMenuItemProps {
	active?: boolean;
	dataQa?: string;
}

// Used to don't lost focus in editor when clicking on dropdown menu item
export const ToolbarDropdownMenuItem = forwardRef<HTMLDivElement, ToolbarDropdownMenuItemProps>((props, ref) => {
	const { active, children, dataQa, ...otherProps } = props;

	const hasAutoMarginChild = Children.toArray(children).some(
		(child) => isValidElement(child) && child.type === DropdownMenuShortcut,
	);

	return (
		<DropdownMenuItem ref={ref} {...otherProps} data-qa={dataQa}>
			{children}
			{active ? (
				<Icon className={cn(!hasAutoMarginChild && "ml-auto")} icon="check" />
			) : (
				<span className={cn("flex w-4 h-4", !hasAutoMarginChild && "ml-auto")} />
			)}
		</DropdownMenuItem>
	);
});
