import type React from "react";

export const TopMenuRightSide = ({ children }: { children: React.ReactNode }) => {
	return <div className="flex flex-row items-center gap-0.5 lg:gap-2">{children}</div>;
};
