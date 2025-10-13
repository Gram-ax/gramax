import { useSyncCount } from "@core-ui/ContextServices/SyncCount/useSyncCount";
import t, { pluralize } from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import { Badge } from "@ui-kit/Badge";
import { ErrorState } from "@ui-kit/ErrorState";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { ReactNode } from "react";

interface MiniTooltipProps {
	trigger: ReactNode;
	text?: string;
	className?: string;
}

const MiniTooltip = ({ trigger, text, className }: MiniTooltipProps) => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className={`flex ${className}`}>{trigger}</div>
			</TooltipTrigger>
			<TooltipContent>{text}</TooltipContent>
		</Tooltip>
	);
};

const CatalogFetchNotification = ({ catalogLink }: { catalogLink: CatalogLink }) => {
	const { syncCount } = useSyncCount(catalogLink);

	if (!syncCount || (!syncCount.errorMessage && !syncCount.hasChanges)) return null;
	if (syncCount.errorMessage) {
		return (
			<Tooltip delayDuration={0}>
				<TooltipContent>{syncCount.errorMessage}</TooltipContent>
				<TooltipTrigger asChild>
					<ErrorState className="justify-start px-0 font-normal text-xs gap-1.5">
						<Icon icon="alert-circle" className="w-3.5 h-3.5" />
					</ErrorState>
				</TooltipTrigger>
			</Tooltip>
		);
	}

	const pushCount = syncCount.changed > 0 ? syncCount.changed : 0;
	const pullCount = syncCount.pull > 0 ? syncCount.pull : 0;
	const hasObviousChanges = pushCount > 0 && pullCount > 0;

	const pushTooltip =
		pushCount &&
		pluralize(pushCount, {
			one: t("sync-catalog-push1"),
			few: t("sync-catalog-push2"),
			many: t("sync-catalog-push3"),
		});

	const pullTooltip =
		pullCount &&
		pluralize(pullCount, {
			one: t("sync-catalog-changed1"),
			few: t("sync-catalog-changed2"),
			many: t("sync-catalog-changed3"),
		});

	return (
		<div className="flex flex-row-reverse">
			{pullCount > 0 && (
				<MiniTooltip
					text={pullTooltip}
					trigger={
						<Badge
							size="sm"
							className="gap-0 p-1 pr-1.5"
							style={{
								paddingLeft: "3px",
								paddingRight: "5px",
								marginLeft: hasObviousChanges ? "-4px" : undefined,
							}}
						>
							<Icon icon="arrow-down" className="text-secondary-fg" size="sm" />
							{pullCount}
						</Badge>
					}
				/>
			)}
			{pushCount > 0 && (
				<MiniTooltip
					text={pushTooltip}
					trigger={
						<Badge
							size="sm"
							focus="high"
							className="gap-0 p-1 pr-1.5"
							style={{ paddingLeft: "3px", paddingRight: "5px", zIndex: 1 }}
						>
							<Icon icon="arrow-up" size="sm" className="text-primary-bg" />
							{pushCount}
						</Badge>
					}
				/>
			)}
		</div>
	);
};

export default CatalogFetchNotification;
