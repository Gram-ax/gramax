import { DropdownMenuSubContent as UiKitDropdownMenuSubContent } from "ics-ui-kit/components/dropdown";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC, forwardRef } from "react";

interface UiKitDropdownMenuSubContentProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuSubContent> {}

export const DropdownMenuSubContent: FC<UiKitDropdownMenuSubContentProps> = forwardRef((props, ref) => {
	return (
		<UiKitDropdownMenuSubContent
			{...props}
			ref={ref}
			data-dropdown-menu-sub-content
			data-qa="dropdown-menu-content"
		/>
	);
});
