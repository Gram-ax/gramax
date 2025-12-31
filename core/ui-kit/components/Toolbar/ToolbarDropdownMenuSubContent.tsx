import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { CSSProperties, forwardRef } from "react";
import { DropdownMenuPrimitive, dropdownMenuContentStyles } from "ics-ui-kit/components/dropdown";
import { useComponentVariant } from "ics-ui-kit/providers/component-variant-context";
import { cn } from "@core-ui/utils/cn";

const PrimitiveDropdownMenuSubContent = DropdownMenuPrimitive.SubContent;

type DropdownMenuSubContentProps = ExtractComponentGeneric<typeof PrimitiveDropdownMenuSubContent>;

interface ToolbarDropdownMenuSubContentProps extends DropdownMenuSubContentProps {
	className?: string;
	contentClassName?: string;

	style?: CSSProperties;
	contentStyle?: CSSProperties;
}

export const ToolbarDropdownMenuSubContent = forwardRef<HTMLDivElement, ToolbarDropdownMenuSubContentProps>(
	(props, ref) => {
		const { children, contentClassName, className, contentStyle, ...otherProps } = props;
		const { variant: theme } = useComponentVariant();

		return (
			<PrimitiveDropdownMenuSubContent
				ref={ref}
				{...otherProps}
				className={cn(
					className,
					"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto overflow-x-hidden",
				)}
				data-dropdown-menu-sub-content
				data-qa="dropdown-menu-sub-content"
			>
				<div className={dropdownMenuContentStyles({ theme, className: contentClassName })} style={contentStyle}>
					{children}
				</div>
			</PrimitiveDropdownMenuSubContent>
		);
	},
);
