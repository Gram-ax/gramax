import { DropdownMenuSubTrigger as UiKitDropdownMenuSubTrigger } from "ics-ui-kit/components/dropdown";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuSubTriggerProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuSubTrigger> {}

export const DropdownMenuSubTrigger: FC<UiKitDropdownMenuSubTriggerProps> = (props) => {
	return <UiKitDropdownMenuSubTrigger {...props} data-testid="dropdown-item" />;
};
