import { DropdownMenuRadioGroup as UiKitDropdownMenuRadioGroup } from "ics-ui-kit/components/dropdown";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuRadioGroupProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuRadioGroup> {}

export const DropdownMenuRadioGroup: FC<UiKitDropdownMenuRadioGroupProps> = (props) => {
	return <UiKitDropdownMenuRadioGroup indicatorIconPosition="end" {...props} />;
};
