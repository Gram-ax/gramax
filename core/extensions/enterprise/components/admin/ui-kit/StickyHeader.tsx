import { cn } from "@core-ui/utils/cn";
import { useAdminHeader } from "@ext/enterprise/components/admin/contexts/AdminHeaderContext";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface StickyHeaderProps {
	title: ReactNode;
	actions?: ReactNode;
	className?: string;
}

export const StickyHeader = ({ title, actions, className }: StickyHeaderProps) => {
	const { headerRef } = useAdminHeader();

	return createPortal(
		<div className={cn("flex flex-row justify-between", className)}>
			<h1 className="text-lg font-medium flex items-center gap-2">{title}</h1>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>,
		headerRef.current,
	);
};
