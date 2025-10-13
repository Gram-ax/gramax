import { DropdownMenuSubContent as UiKitDropdownMenuSubContent } from "ics-ui-kit/components/dropdown";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

interface UiKitDropdownMenuSubContentProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuSubContent> {}

export const DropdownMenuSubContent: FC<UiKitDropdownMenuSubContentProps> = (props) => {
	return <UiKitDropdownMenuSubContent {...props} data-dropdown-menu-sub-content data-qa="dropdown-menu-content" />;
};
