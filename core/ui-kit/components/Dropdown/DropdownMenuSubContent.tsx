import { DropdownMenuSubContent as UiKitDropdownMenuSubContent } from "ics-ui-kit/components/dropdown";
import { type FC, forwardRef } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuSubContentProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuSubContent> {}

export const DropdownMenuSubContent: FC<UiKitDropdownMenuSubContentProps> = forwardRef((props, ref) => {
	return (
		<UiKitDropdownMenuSubContent
			{...props}
			data-dropdown-menu-sub-content
			data-qa="dropdown-menu-content"
			data-testid="sub-content"
			ref={ref}
		/>
	);
});
