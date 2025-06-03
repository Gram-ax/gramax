import { SelectValue as UiKitSelectValue } from "ics-ui-kit/components/select";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitSelectValueProps extends ExtractComponentGeneric<typeof UiKitSelectValue> {}

export const SelectValue: FC<UiKitSelectValueProps> = (props) => {
	return <UiKitSelectValue data-radix-select-value {...props} />;
};
