import { cn } from "@core-ui/utils/cn";

interface TableToolbarProps {
	input?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

export const TableToolbar = ({ children, input, className }: TableToolbarProps) => {
	return (
		<div className={cn("flex items-center gap-3 py-4", className)}>
			{input && <div className="flex-1 min-w-0">{input}</div>}
			<div className="flex items-center gap-3 flex-shrink-0 ml-auto">{children}</div>
		</div>
	);
};
