import { cn } from "@core-ui/utils/cn";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import type { HTMLAttributes } from "react";

const CommandLabel = (props: HTMLAttributes<HTMLDivElement>) => {
	const { children, className, ...rest } = props;
	return (
		<div className={cn("text-inverse-muted text-xs font-medium truncate", className)} {...rest}>
			{children}
		</div>
	);
};

export const LinkMenuBreadcrumb = (props: HTMLAttributes<HTMLDivElement> & { breadcrumb: string[] }) => {
	const { breadcrumb, children, className, ...rest } = props;

	const isLongBreadcrumb = breadcrumb.length > 2;
	const firstBreadcrumb = isLongBreadcrumb ? breadcrumb[0] : null;
	const lastBreadcrumb = isLongBreadcrumb ? breadcrumb[breadcrumb.length - 1] : null;

	return (
		<div
			className={cn("flex items-center gap-1 overflow-hidden max-w-full truncate py-1.5 pb-0.5 px-2", className)}
			{...rest}
		>
			{!isLongBreadcrumb &&
				breadcrumb.map((breadcrumb, index) => (
					<>
						{index > 0 && (
							<CommandLabel className="flex-shrink-0">
								<span>/</span>
							</CommandLabel>
						)}
						<CommandLabel className="inline-flex" key={breadcrumb}>
							<TextOverflowTooltip>{breadcrumb}</TextOverflowTooltip>
						</CommandLabel>
					</>
				))}

			{isLongBreadcrumb && lastBreadcrumb && (
				<>
					<CommandLabel className="flex-shrink-0">
						<span>{firstBreadcrumb}</span>
					</CommandLabel>
					<CommandLabel className="flex-shrink-0">
						<span>/</span>
					</CommandLabel>
					<CommandLabel className="flex-shrink-0">
						<span>...</span>
					</CommandLabel>
					<CommandLabel className="flex-shrink-0">
						<span>/</span>
					</CommandLabel>
					<CommandLabel className="inline-flex">
						<TextOverflowTooltip>{lastBreadcrumb}</TextOverflowTooltip>
					</CommandLabel>
				</>
			)}
			{children}
		</div>
	);
};
