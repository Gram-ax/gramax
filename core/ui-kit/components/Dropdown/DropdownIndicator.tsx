import { Indicator } from "@ui-kit/Indicator";
import { CSSProperties } from "react";

export const DropdownIndicator = ({ className, style }: { className?: string; style?: CSSProperties }) => {
	return <Indicator size="xs" rounded className={`bg-status-error absolute m-0.5 ${className}`} style={style} />;
};
