import { DropdownMenuRadioGroup as UiKitDropdownMenuRadioGroup } from "ics-ui-kit/components/dropdown";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

interface UiKitDropdownMenuRadioGroupProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuRadioGroup> {}

export const DropdownMenuRadioGroup: FC<UiKitDropdownMenuRadioGroupProps> = (props) => {
	return <UiKitDropdownMenuRadioGroup indicatorIconPosition="end" {...props} />;
};
