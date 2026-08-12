import { useResolveShortcut } from "@core-ui/hooks/useResolveShortcut";
import { cn } from "@core-ui/utils/cn";
import { Shortcut as UiKitShortcut } from "ics-ui-kit/components/shortcut";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitShortcutProps = ExtractComponentGeneric<typeof UiKitShortcut>;

export interface ShortcutProps extends Omit<UiKitShortcutProps, "children"> {
	value: string;
	inverse?: boolean;
}

export const Shortcut = ({ value, inverse, className, ...otherProps }: ShortcutProps) => {
	const keys = useResolveShortcut(value);

	return (
		<UiKitShortcut {...otherProps} className={cn(className, inverse && "text-inverse-muted")}>
			{keys}
		</UiKitShortcut>
	);
};
