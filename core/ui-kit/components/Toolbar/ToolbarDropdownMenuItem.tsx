import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

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
			{active ? <Icon className="ml-auto" icon="check" /> : <span className="ml-auto flex w-4 h-4" />}
		</DropdownMenuItem>
	);
});
