import { Select as UiKitSelect } from "ics-ui-kit/components/select";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitSelectProps = ExtractComponentGeneric<typeof UiKitSelect>;

interface SelectProps extends UiKitSelectProps {}

export const Select: FC<SelectProps> = (props) => {
	return <UiKitSelect {...props} data-testid="select" />;
};
