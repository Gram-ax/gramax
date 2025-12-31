import { ToolbarTrigger as UiKitToolbarTrigger } from "ics-ui-kit/components/toolbar";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { forwardRef } from "react";
import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";

type UiKitToolbarTriggerProps = ExtractComponentGeneric<typeof UiKitToolbarTrigger>;

const StyledUiKitToolbarTrigger = styled(UiKitToolbarTrigger)`
	&:hover,
	&[data-open="open"] {
		background-color: hsl(var(--inverse-hover));
	}
`;

export const ToolbarTrigger = forwardRef<HTMLButtonElement, UiKitToolbarTriggerProps>((props, ref) => {
	const { className, ...otherProps } = props;
	return <StyledUiKitToolbarTrigger ref={ref} className={cn(className, "p-1")} {...otherProps} />;
});
