import { DropdownMenuItem as UiKitDropdownMenuItem } from "ics-ui-kit/components/dropdown";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";
import styled from "@emotion/styled";

type DropdownMenuItemType = "default" | "danger";

interface UiKitDropdownMenuItemProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuItem> {
	type?: DropdownMenuItemType;
}

const BaseDropdownMenuItem: FC<UiKitDropdownMenuItemProps> = (props) => {
	return (
		<UiKitDropdownMenuItem
			{...props}  
			data-qa="qa-clickable"
			data-dropdown-item-type={props.type}
			data-dropdown-menu-item
		/>
	);
};

export const DropdownMenuItem = styled(BaseDropdownMenuItem)`
	&[data-dropdown-item-type="danger"] {
		&:hover,
		&:hover svg {
			transition: inherit;
			color: hsl(var(--status-error-hover)) !important;
		}
	}
`;
