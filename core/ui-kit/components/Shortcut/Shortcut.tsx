import { cn } from "@core-ui/utils/cn";
import { ExtractComponentGeneric } from "core/ui-kit/lib/extractComponentGeneric";
import { Shortcut as UiKitShortcut } from "ics-ui-kit/components/shortcut";
import { useResolveShortcut } from "@core-ui/hooks/useResolveShortcut";

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
