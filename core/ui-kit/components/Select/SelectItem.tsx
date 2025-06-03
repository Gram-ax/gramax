import { SelectItem as UiKitSelectItem } from "ics-ui-kit/components/select";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

type UiKitSelectProps = ExtractComponentGeneric<typeof UiKitSelectItem>;

interface SelectItemProps extends UiKitSelectProps {}

export const SelectItem: FC<SelectItemProps> = (props) => {
	return <UiKitSelectItem data-qa={"qa-clickable"} data-raidx-select-item {...props} />;
};
