import { DropdownMenuContent as UiKitDropdownMenuContent } from "ics-ui-kit/components/dropdown";
import { type FC, forwardRef } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuContentProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuContent> {}

export const DropdownMenuContent: FC<UiKitDropdownMenuContentProps> = forwardRef((props, ref) => {
	return (
		<UiKitDropdownMenuContent
			ref={ref}
			{...props}
			data-dropdown-menu-content
			data-qa="dropdown-content"
			data-testid="dropdown-content"
		/>
	);
});
