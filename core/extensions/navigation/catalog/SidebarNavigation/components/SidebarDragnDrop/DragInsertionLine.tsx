import { cn } from "@core-ui/utils/cn";
import { Icon } from "@ui-kit/Icon";

interface DragInsertionLineProps {
	className?: string;
	position?: "top" | "bottom";
}

export const DragInsertionLine = ({ className, position = "bottom" }: DragInsertionLineProps) => {
	return (
		<div
			className={cn(
				"pointer-events-none absolute -left-[3.5px] right-0 z-20 flex h-3 flex-row items-center border-none bg-transparent p-0",
				position === "top" ? "top-0 -translate-y-1/2" : "bottom-0 translate-y-1/2",
				className,
			)}
			data-sidebar="drag-insertion-line"
		>
			<Icon className="h-2 w-2 shrink-0 stroke-[3] text-primary-fg" icon="circle" size="sm" />
			<div className="h-px w-full rounded-full bg-primary-fg" />
		</div>
	);
};
