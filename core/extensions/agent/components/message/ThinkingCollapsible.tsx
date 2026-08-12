import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Divider } from "@ui-kit/Divider";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { type ReactNode, useEffect, useState } from "react";
import { formatElapsed } from "../utils/formatDuration";

type ThinkingCollapsibleProps = {
	children: ReactNode;
	durationMs?: number;
	startedAt: number;
	hasContent?: boolean;
	isActive?: boolean;
};

export const ThinkingCollapsible = ({
	children,
	durationMs,
	startedAt,
	hasContent = false,
	isActive = false,
}: ThinkingCollapsibleProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);

	const isFinished = durationMs !== undefined;
	const showWorking = isActive && !isFinished;

	useEffect(() => {
		if (!showWorking) return;
		setElapsed(Date.now() - startedAt);
		const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
		return () => clearInterval(id);
	}, [showWorking, startedAt]);

	return (
		<Collapsible onOpenChange={hasContent ? setIsOpen : undefined} open={isOpen}>
			<CollapsibleTrigger asChild>
				<div
					className={cn(
						"flex select-none items-center gap-1 text-sm text-muted-foreground",
						hasContent && "cursor-pointer",
					)}
				>
					<div className="flex select-none items-center gap-2">
						{showWorking ? (
							<>
								<Loader className="px-0 text-muted-foreground" size="sm" />
								<span>{t("agent.thinking-working")}</span>
								<span className="tabular-nums">{formatElapsed(elapsed)}</span>
							</>
						) : (
							<>
								<Icon className="size-3.5 shrink-0" icon="pencil-ruler" />
								<span>
									{isFinished
										? `${t("agent.thinking-worked")} ${formatElapsed(durationMs)}`
										: t("agent.thinking-done")}
								</span>
							</>
						)}
					</div>
					{hasContent && (
						<Icon
							className={cn("size-3.5 shrink-0 transition-transform", !isOpen && "-rotate-90")}
							icon="chevron-down"
						/>
					)}
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="grid max-w-full min-w-0 grid-cols-[min-content_minmax(0,1fr)] items-start pt-1">
					<div className="relative mr-1.5 flex h-full min-h-3 w-4 min-w-4 origin-top items-start justify-center overflow-hidden">
						<Divider className="absolute top-0 min-h-3" orientation="vertical" />
					</div>
					<div className="relative w-full">
						<div className="space-y-2">{children}</div>
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};
