import { cn } from "@core-ui/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type ReadonlyMenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean };

export const ReadonlyMenuButton = ({ className, isActive, ...props }: ReadonlyMenuButtonProps) => (
	<button
		className={cn(
			"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-lg bg-primary-bg p-2 text-left text-sm text-secondary-fg outline-none transition-[width,height,padding]",
			"hover:bg-secondary-bg-hover hover:text-primary-fg focus-visible:shadow-focus",
			"data-[active=true]:bg-primary-bg-hover data-[active=true]:font-medium data-[active=true]:text-primary-accent",
			"data-[active=true]:hover:bg-primary-bg-hover data-[active=true]:hover:text-primary-accent",
			"[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
			className,
		)}
		data-active={isActive}
		data-sidebar="menu-button"
		{...props}
	/>
);
