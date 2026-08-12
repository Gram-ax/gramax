import { cn } from "@core-ui/utils/cn";
import { forwardRef } from "react";

type PreviewContainerProps = React.HTMLAttributes<HTMLDivElement>;

const PreviewContainerUnstyled = forwardRef<HTMLDivElement, PreviewContainerProps>((props, ref) => {
	const { className, ...rest } = props;
	return (
		<div
			className={cn(
				"grid h-full w-full content-stretch [&[data-loaded=false]>div:last-of-type]:pointer-events-none [&[data-loaded=false]>div:last-of-type]:opacity-0",
				className,
			)}
			ref={ref}
			{...rest}
		/>
	);
});

export const PreviewContainer = PreviewContainerUnstyled;
