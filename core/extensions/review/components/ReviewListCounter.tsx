import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Indicator } from "@ui-kit/Indicator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface ReviewListCounterProps {
	count: number;
	unreadCount?: number;
	indicator?: boolean;
	className?: string;
}

export const ReviewListCounter = ({ count, unreadCount, indicator = true, className }: ReviewListCounterProps) => {
	const tooltipText =
		unreadCount > 0
			? `${t("editor.modes.counter.unread")}: ${unreadCount}. ${t("editor.modes.counter.total")}: ${count}`
			: `${t("editor.modes.counter.total")}: ${count}`;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className={cn(
						"flex items-center gap-1 cursor-default ml-2 text-[var(--color-merge-request-text)] font-medium",
						className,
					)}
				>
					{unreadCount > 0 && (
						<>
							{indicator && <Indicator className="bg-status-error rounded-full mr-0.5" size="xs" />}
							<span className="text-xs">{unreadCount}</span>
							<span className="text-xs">/</span>
						</>
					)}
					<span className="text-xs">{count}</span>
				</div>
			</TooltipTrigger>
			<TooltipContent>{tooltipText}</TooltipContent>
		</Tooltip>
	);
};
