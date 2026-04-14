import { TopMenuStyledLogo } from "@components/HomePage/TopMenuLogo";
import type React from "react";

export const TopMenuLeftSideWithLogo = ({ children }: { children?: React.ReactNode }) => {
	return (
		<div className="flex flex-row items-center gap-3 lg:gap-6">
			<div>
				<TopMenuStyledLogo />
			</div>
			<div className="flex flex-row items-center lg:gap-2">{children}</div>
		</div>
	);
};
