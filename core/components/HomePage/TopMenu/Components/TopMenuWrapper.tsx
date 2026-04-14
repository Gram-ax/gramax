import { classNames } from "@components/libs/classNames";
import type React from "react";

export const TopMenuWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
	return (
		<div
			className={classNames(`w-full bg-alpha-40 top-0`, {}, [className])}
			data-qa="top-menu"
			data-testid="top-menu"
			role="menubar"
			style={{ backdropFilter: "blur(24px)", position: "sticky", zIndex: "var(--z-index-top-menu)" }}
		>
			<div className="top-menu">
				<div className={`flex flex-row items-center justify-between py-1.5 lg:py-2.5`}>{children}</div>
			</div>
		</div>
	);
};
