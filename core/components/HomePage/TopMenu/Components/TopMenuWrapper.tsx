import { cn } from "@core-ui/utils/cn";
import type React from "react";

const TopMenuWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
	return (
		<div
			className={cn("w-full bg-alpha-40 top-0", className)}
			data-qa="top-menu"
			data-testid="top-menu"
			role="menubar"
			style={{ backdropFilter: "blur(24px)", position: "sticky", zIndex: "var(--z-index-top-menu)" }}
		>
			<div className="top-menu">
				<div
					className={cn(
						"flex flex-row items-center justify-between py-1.5 lg:py-2.5",
						"[.menu-open[data-state=open]_&]:bg-[hsl(var(--alpha-high-05))]",
					)}
				>
					{children}
				</div>
			</div>
		</div>
	);
};

export const TopMenuLeftSide = ({ children }: { children: React.ReactNode }) => {
	return <div className="flex flex-row items-center gap-3 lg:gap-6">{children}</div>;
};

export const TopMenuLeftSideActions = ({ children }: { children?: React.ReactNode }) => {
	return <div className="flex flex-row items-center lg:gap-2">{children}</div>;
};

export const TopMenuRightSide = ({ children }: { children: React.ReactNode }) => {
	return <div className="flex flex-row items-center gap-0.5 lg:gap-2">{children}</div>;
};

export default TopMenuWrapper;
