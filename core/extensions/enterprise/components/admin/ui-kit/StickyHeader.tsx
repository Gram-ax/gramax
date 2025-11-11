import { cn } from "@core-ui/utils/cn";
import { ReactNode } from "react";

interface StickyHeaderProps {
	title: ReactNode;
	actions?: ReactNode;
	isScrolled?: boolean;
	className?: string;
}

export function StickyHeader({ title, actions, isScrolled, className }: StickyHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-row justify-between sticky top-0 bg-background pt-3 pb-3 z-10 items-center",
				isScrolled && "shadow-[0_5px_5px_-4px_rgba(0,0,0,0.3)]",
				className,
			)}
		>
			<h1 className="text-2xl font-bold flex items-center gap-2">{title}</h1>
			{actions && <div className="flex items-center gap-2 min-h-[40px]">{actions}</div>}
		</div>
	);
}
