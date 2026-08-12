import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { Icon } from "@ui-kit/Icon";
import { tv } from "tailwind-variants";

export interface InlineTriggerButtonProps extends React.HTMLAttributes<HTMLSpanElement> {
	icon?: IconCode;
}

const inlineTriggerButtonStyles = tv({
	base: [
		"inline-flex aspect-square cursor-pointer select-none items-center justify-center overflow-hidden rounded-lg bg-transparent p-2.5 text-muted transition-all",
		"hover:text-primary-fg focus-visible:shadow-focus focus-visible:outline-none active:scale-90",
	],
});

export const InlineTriggerButton: React.FC<InlineTriggerButtonProps> = ({
	className,
	onClick,
	icon = "circle-x",
	...props
}) => {
	// Prevent default action and stop propagation to avoid triggering parent event handlers.
	// Use this component only when you need to add interactive button in the trigger button like clear button or random button.
	const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
		e.preventDefault();
		e.stopPropagation();
		onClick?.(e);
	};

	return (
		<span className={inlineTriggerButtonStyles({ className })} onClick={handleClick} {...props}>
			<Icon icon={icon} />
		</span>
	);
};

InlineTriggerButton.displayName = "InlineTriggerButton";
