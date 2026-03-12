import { cn } from "@core-ui/utils/cn";
import { Indicator } from "@ui-kit/Indicator";
import type { ExtractComponentGeneric } from "core/ui-kit/lib/extractComponentGeneric";

type DropdownIndicatorProps = ExtractComponentGeneric<typeof Indicator>;

export const DropdownIndicator = (props: DropdownIndicatorProps) => {
	const { className, ...otherProps } = props;
	return <Indicator {...otherProps} className={cn("bg-status-error", className)} rounded size="xs" />;
};
