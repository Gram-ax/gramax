import { SelectItem as UiKitSelectItem } from "ics-ui-kit/components/select";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitSelectProps = ExtractComponentGeneric<typeof UiKitSelectItem>;

interface SelectItemProps extends UiKitSelectProps {}

export const SelectItem: FC<SelectItemProps> = (props) => {
	return <UiKitSelectItem data-qa={"qa-clickable"} data-raidx-select-item {...props} data-testid="select-item" />;
};
