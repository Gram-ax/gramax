import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { forwardRef } from "react";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";

type DropdownMenuItemProps = ExtractComponentGeneric<typeof DropdownMenuItem>;

export interface ToolbarDropdownMenuItemProps extends DropdownMenuItemProps {
	active?: boolean;
	dataQa?: string;
}

// Used to don't lost focus in editor when clicking on dropdown menu item
export const ToolbarDropdownMenuItem = forwardRef<HTMLDivElement, ToolbarDropdownMenuItemProps>((props, ref) => {
	const { active, children, dataQa, ...otherProps } = props;

	return (
		<DropdownMenuItem ref={ref} {...otherProps} data-qa={dataQa}>
			{children}
			{active ? <Icon icon="check" className="ml-auto" /> : <span className="ml-auto flex w-4 h-4" />}
		</DropdownMenuItem>
	);
});
