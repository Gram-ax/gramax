import { DropdownMenuCheckboxItem as UiKitDropdownMenuCheckboxItem } from "ics-ui-kit/components/dropdown";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuCheckboxItemProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuCheckboxItem> {}

export const DropdownMenuCheckboxItem: FC<UiKitDropdownMenuCheckboxItemProps> = (props) => {
	return (
		<UiKitDropdownMenuCheckboxItem
			{...props}
			data-dropdown-menu-item
			data-qa="qa-clickable"
			data-testid="dropdown-item"
		/>
	);
};
