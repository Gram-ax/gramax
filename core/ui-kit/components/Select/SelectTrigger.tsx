import { SelectTrigger as UiKitSelectTrigger } from "ics-ui-kit/components/select";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

type UiKitSelectPropsProps = ExtractComponentGeneric<typeof UiKitSelectTrigger>;

interface SelectTriggerProps extends UiKitSelectPropsProps {}

export const SelectTrigger: FC<SelectTriggerProps> = (props) => {
	return <UiKitSelectTrigger data-radix-select-trigger {...props} />;
};
