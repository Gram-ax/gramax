import styled from "@emotion/styled";
import { DropdownMenuItem as UiKitDropdownMenuItem } from "ics-ui-kit/components/dropdown";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type DropdownMenuItemType = "default" | "danger";

interface UiKitDropdownMenuItemProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuItem> {
	type?: DropdownMenuItemType;
}

const BaseDropdownMenuItem: FC<UiKitDropdownMenuItemProps> = (props) => {
	return (
		<UiKitDropdownMenuItem
			{...props}
			data-dropdown-item-type={props.type}
			data-dropdown-menu-item
			data-qa="qa-clickable"
			data-testid="dropdown-item"
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
