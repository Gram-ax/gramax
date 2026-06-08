import type { HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

interface GroupHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

const groupHeaderStyles = tv({
	base: "group-header w-full -mb-1 cursor-pointer hover:text-[var(--color-primary)]",
});

export const GroupHeader = ({ children, className, ...props }: GroupHeaderProps) => (
	<div className={groupHeaderStyles({ className })} {...props}>
		{children}
	</div>
);
