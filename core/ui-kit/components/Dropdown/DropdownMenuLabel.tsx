import { DropdownMenuLabel as UiKitDropdownMenuLabel } from "ics-ui-kit/components/dropdown";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";
import styled from "@emotion/styled";

interface UiKitDropdownMenuLabelProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuLabel> {}

const DropdownMenuLabelUnstyled: FC<UiKitDropdownMenuLabelProps> = (props) => {
	return <UiKitDropdownMenuLabel {...props} />;
};

export const DropdownMenuLabel = styled(DropdownMenuLabelUnstyled)`
	color: hsl(var(--primary-fg));
`;
