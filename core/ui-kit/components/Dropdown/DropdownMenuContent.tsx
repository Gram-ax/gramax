import { DropdownMenuContent as UiKitDropdownMenuContent } from "ics-ui-kit/components/dropdown";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

interface UiKitDropdownMenuContentProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuContent> {}

export const DropdownMenuContent: FC<UiKitDropdownMenuContentProps> = (props) => {
	return <UiKitDropdownMenuContent {...props} data-dropdown-menu-content data-qa="dropdown-menu-content" />;
};
