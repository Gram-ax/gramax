import { useResolveShortcut } from "@core-ui/hooks/useResolveShortcut";
import { cn } from "@core-ui/utils/cn";
import type { ExtractComponentGeneric } from "core/ui-kit/lib/extractComponentGeneric";
import { DropdownMenuShortcut as UiKitDropdownMenuShortcut } from "ics-ui-kit/components/dropdown";

type UiKitDropdownMenuShortcutProps = ExtractComponentGeneric<typeof UiKitDropdownMenuShortcut>;

export interface DropdownMenuShortcutProps extends Omit<UiKitDropdownMenuShortcutProps, "children"> {
	value: string;
	inverse?: boolean;
}

export const DropdownMenuShortcut = ({ value, inverse, className, ...otherProps }: DropdownMenuShortcutProps) => {
	const keys = useResolveShortcut(value);

	return (
		<UiKitDropdownMenuShortcut {...otherProps} className={cn(className, inverse && "text-inverse-muted ml-auto")}>
			{keys}
		</UiKitDropdownMenuShortcut>
	);
};
