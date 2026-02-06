import { SelectContent as UiKitSelectContent } from "ics-ui-kit/components/select";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitSelectContentProps extends ExtractComponentGeneric<typeof UiKitSelectContent> {
	maxItems?: number;
}

export const SelectContent: FC<UiKitSelectContentProps> = (props) => {
	return <UiKitSelectContent data-radix-select {...props} data-testid="select-content" />;
};
