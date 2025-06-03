import { SelectContent as UiKitSelectContent } from "ics-ui-kit/components/select";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitSelectContentProps extends ExtractComponentGeneric<typeof UiKitSelectContent> {
	maxItems?: number;
}

export const SelectContent: FC<UiKitSelectContentProps> = (props) => {
	return <UiKitSelectContent data-radix-select {...props} />;
};
