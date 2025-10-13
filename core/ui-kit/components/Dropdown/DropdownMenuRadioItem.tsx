import { DropdownMenuRadioItem as UiKitDropdownMenuRadioItem } from "ics-ui-kit/components/dropdown";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

interface UiKitDropdownMenuRadioItemProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuRadioItem> {}

export const DropdownMenuRadioItem: FC<UiKitDropdownMenuRadioItemProps> = (props) => {
	return <UiKitDropdownMenuRadioItem {...props} data-qa="qa-clickable" data-dropdown-menu-item />;
};
