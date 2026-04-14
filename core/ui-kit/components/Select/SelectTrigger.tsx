import { SelectTrigger as UiKitSelectTrigger } from "ics-ui-kit/components/select";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitSelectPropsProps = ExtractComponentGeneric<typeof UiKitSelectTrigger>;

interface SelectTriggerProps extends UiKitSelectPropsProps {}

export const SelectTrigger: FC<SelectTriggerProps> = (props) => {
	return <UiKitSelectTrigger data-radix-select-trigger {...props} />;
};
