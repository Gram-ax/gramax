import { cn } from "@core-ui/utils/cn";
import { Description } from "@ui-kit/Description";
import type { ReactNode } from "react";

export const sectionTitleClass = "text-lg font-medium";

interface SettingsSectionProps {
	title?: ReactNode;
	count?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
	className?: string;
	contentClassName?: string;
	titleClassName?: string;
}

export const SettingsSection = ({
	title,
	count,
	description,
	actions,
	children,
	className,
	contentClassName,
	titleClassName,
}: SettingsSectionProps) => {
	const hasHeader = title !== undefined || count !== undefined || actions !== undefined;

	return (
		<div className={cn("space-y-4", className)}>
			{hasHeader && (
				<div className={"flex items-center justify-between gap-4"}>
					<div className="flex items-baseline gap-2">
						{title !== undefined && <h2 className={cn(sectionTitleClass, titleClassName)}>{title}</h2>}
						{count !== undefined && count}
					</div>
					{actions}
				</div>
			)}
			{description && <Description>{description}</Description>}
			{children && <div className={contentClassName}>{children}</div>}
		</div>
	);
};
