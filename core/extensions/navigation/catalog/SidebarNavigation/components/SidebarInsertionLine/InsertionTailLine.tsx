import { cn } from "@core-ui/utils/cn";

export const InsertionTailLine = ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
	return (
		<div
			className={cn(
				"pointer-events-none absolute right-0 top-1/2 h-px -translate-y-1/2 rounded-full opacity-0 [transition:left_160ms_ease-out,opacity_160ms_75ms] group-hover/insertion:opacity-100",
				className,
			)}
			style={style}
		/>
	);
};
