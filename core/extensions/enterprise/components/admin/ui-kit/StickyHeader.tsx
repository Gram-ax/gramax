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
			className={cn("flex flex-row justify-between top-0 bg-background pb-3 px-6 z-10 items-center", className)}
			style={{
				position: "sticky",
				top: 0,
				zIndex: 10,
				paddingTop: "1.5rem",
				boxShadow: isScrolled ? "var(--bar-shadow-vertical)" : "none",
			}}
		>
			<h1 className="text-2xl font-bold flex items-center gap-2">{title}</h1>
			{actions && <div className="flex items-center gap-2 min-h-[40px]">{actions}</div>}
		</div>
	);
}
