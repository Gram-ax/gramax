import { SelectValue as UiKitSelectValue } from "ics-ui-kit/components/select";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitSelectValueProps extends ExtractComponentGeneric<typeof UiKitSelectValue> {}

export const SelectValue: FC<UiKitSelectValueProps> = (props) => {
	return <UiKitSelectValue data-radix-select-value {...props} />;
};
