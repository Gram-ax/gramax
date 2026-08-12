import { cn } from "@core-ui/utils/cn";
import { Counter as OrigCounter } from "@ui-kit/Counter";
import type { ComponentProps } from "react";

type CounterProps = ComponentProps<typeof OrigCounter>;

export const BigCounter = (props: CounterProps) => {
	const { className, ...rest } = props;
	return (
		<OrigCounter
			className={cn("rounded-full tabular-nums pl-1.5 pr-1.5", className)}
			size="lg"
			variant="secondary"
			{...rest}
		/>
	);
};
