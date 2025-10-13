import { DropdownMenu as UiKitDropdownMenu } from "ics-ui-kit/components/dropdown";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

interface UiKitDropdownMenuProps extends ExtractComponentGeneric<typeof UiKitDropdownMenu> {}

export const DropdownMenu: FC<UiKitDropdownMenuProps> = (props) => {
	return <UiKitDropdownMenu {...props} data-dropdown-menu />;
};
