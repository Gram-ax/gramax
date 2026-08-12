import { cn } from "@core-ui/utils/cn";

export const VerticalLineSegment = ({ className }: { className?: string }) => {
	return (
		<span
			className={cn(
				"pointer-events-none absolute -top-0.5 bottom-0 z-10 w-px rounded-full bg-primary-border",
				className,
			)}
		/>
	);
};
