import { Select as UiKitSelect } from "ics-ui-kit/components/select";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

type UiKitSelectProps = ExtractComponentGeneric<typeof UiKitSelect>;

interface SelectProps extends UiKitSelectProps {}

export const Select: FC<SelectProps> = (props) => {
	return <UiKitSelect {...props} />;
};
