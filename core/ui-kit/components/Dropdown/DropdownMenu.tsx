import { DropdownMenu as UiKitDropdownMenu } from "ics-ui-kit/components/dropdown";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuProps extends ExtractComponentGeneric<typeof UiKitDropdownMenu> {}

export const DropdownMenu: FC<UiKitDropdownMenuProps> = (props) => {
	return <UiKitDropdownMenu {...props} data-dropdown-menu data-testid="dropdown" />;
};
