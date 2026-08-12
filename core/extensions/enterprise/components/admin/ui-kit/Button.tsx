import { cn } from "@core-ui/utils/cn";
import { Button as OrigButton } from "@ui-kit/Button";
import { type ComponentProps, forwardRef } from "react";

export type ButtonProps = ComponentProps<typeof OrigButton>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	const { className, ...rest } = props;
	return <OrigButton className={cn("px-3", className)} ref={ref} type="button" {...rest} />;
});
