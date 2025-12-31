import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { CSSProperties, forwardRef, useCallback } from "react";
import { DropdownMenuPrimitive, dropdownMenuContentStyles } from "ics-ui-kit/components/dropdown";
import { useComponentVariant } from "ics-ui-kit/providers/component-variant-context";
import { cn } from "@core-ui/utils/cn";

const PrimitiveDropdownMenuContent = DropdownMenuPrimitive.Content;
const PrimitiveDropdownMenuPortal = DropdownMenuPrimitive.Portal;

type DropdownMenuContentProps = ExtractComponentGeneric<typeof PrimitiveDropdownMenuContent>;

interface ToolbarDropdownMenuContentProps extends DropdownMenuContentProps {
	className?: string;
	contentClassName?: string;

	style?: CSSProperties;
	contentStyle?: CSSProperties;
}

export const ToolbarDropdownMenuContent = forwardRef<HTMLDivElement, ToolbarDropdownMenuContentProps>((props, ref) => {
	const {
		children,
		contentClassName,
		className,
		contentStyle,
		onCloseAutoFocus: PropOnCloseAutoFocus,
		...otherProps
	} = props;
	const { variant: theme } = useComponentVariant();

	const onCloseAutoFocus = useCallback(
		(event: Event) => {
			event.preventDefault();
			PropOnCloseAutoFocus?.(event);
		},
		[PropOnCloseAutoFocus],
	);

	return (
		<PrimitiveDropdownMenuPortal>
			<PrimitiveDropdownMenuContent
				ref={ref}
				{...otherProps}
				className={cn(
					className,
					"z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto overflow-x-hidden",
				)}
				data-dropdown-menu-content
				data-qa="dropdown-menu-content"
				onCloseAutoFocus={onCloseAutoFocus}
			>
				<div className={dropdownMenuContentStyles({ theme, className: contentClassName })} style={contentStyle}>
					{children}
				</div>
			</PrimitiveDropdownMenuContent>
		</PrimitiveDropdownMenuPortal>
	);
});
