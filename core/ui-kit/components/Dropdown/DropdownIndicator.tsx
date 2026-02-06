import { Indicator } from "@ui-kit/Indicator";
import type { CSSProperties } from "react";

export const DropdownIndicator = ({ className, style }: { className?: string; style?: CSSProperties }) => {
	return <Indicator className={`bg-status-error absolute m-0.5 ${className}`} rounded size="xs" style={style} />;
};
