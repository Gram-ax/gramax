import { DropdownMenuRadioItem as UiKitDropdownMenuRadioItem } from "ics-ui-kit/components/dropdown";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuRadioItemProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuRadioItem> {}

export const DropdownMenuRadioItem: FC<UiKitDropdownMenuRadioItemProps> = (props) => {
	return (
		<UiKitDropdownMenuRadioItem
			{...props}
			data-dropdown-menu-item
			data-qa="qa-clickable"
			data-testid="dropdown-item"
		/>
	);
};
