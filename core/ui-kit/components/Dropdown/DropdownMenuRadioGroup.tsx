import { DropdownMenuRadioGroup as UiKitDropdownMenuRadioGroup } from "ics-ui-kit/components/dropdown";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuRadioGroupProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuRadioGroup> {}

export const DropdownMenuRadioGroup: FC<UiKitDropdownMenuRadioGroupProps> = (props) => {
	return <UiKitDropdownMenuRadioGroup indicatorIconPosition="end" {...props} />;
};
