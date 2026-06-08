import { RevisionArticlesFilter } from "@ext/git/actions/Revisions/components/RevisionsTab/Filters/RevisionArticlesFilter";
import { RevisionAuthorsFilter } from "@ext/git/actions/Revisions/components/RevisionsTab/Filters/RevisionAuthorsFilter";
import { RevisionDateFilter } from "@ext/git/actions/Revisions/components/RevisionsTab/Filters/RevisionDateFilter";
import { useRevisionCatalogStore } from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import t from "@ext/localization/locale/translate";
import { Button, TriggerButton } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Icon } from "@ui-kit/Icon";
import { Indicator } from "@ui-kit/Indicator";
import { Popover, PopoverAnchor, PopoverContent } from "@ui-kit/Popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { memo, type RefObject, useCallback, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

export const RevisionCatalogFilters = memo(({ tabWrapperRef }: { tabWrapperRef: RefObject<HTMLDivElement> }) => {
	const [isOpen, setIsOpen] = useState(false);

	const { filter, setFilter } = useRevisionCatalogStore((state) => ({
		filter: state.filter,
		setFilter: state.setFilter,
	}));

	const handleReset = useCallback(() => {
		setFilter(null);
	}, [setFilter]);

	const hasActiveFilters = useMemo(() => {
		return filter?.authors?.length || filter?.afterDate || filter?.beforeDate || filter?.articles?.length;
	}, [filter]);

	const dateRange: DateRange = useMemo(
		() => ({
			from: filter?.afterDate ? new Date(filter.afterDate) : undefined,
			to: filter?.beforeDate ? new Date(filter.beforeDate) : undefined,
		}),
		[filter?.afterDate, filter?.beforeDate],
	);

	const handleOpenChange = useCallback((open: boolean) => {
		setIsOpen(open);
	}, []);

	const onInteractOutside = useCallback((event) => {
		const isRevisionCatalogFiltersPopover = event.target.closest(
			"[aria-controls='revision-catalog-filters-popover']",
		);
		if (isRevisionCatalogFiltersPopover) {
			event.preventDefault();
			return;
		}
	}, []);
	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<TriggerButton
						aria-controls="revision-catalog-filters-popover"
						className="relative shrink-0"
						data-state={isOpen ? "open" : "closed"}
						onClick={() => handleOpenChange(!isOpen)}
						size="xs"
						variant="text"
					>
						<Icon className="h-4 w-4" icon="filter" />
						{hasActiveFilters && (
							<Indicator className="rounded-full absolute right-1.5 top-0.5 bg-status-info" size="sm" />
						)}
					</TriggerButton>
				</TooltipTrigger>
				<TooltipContent>{t("git.history.filters.title")}</TooltipContent>
			</Tooltip>
			<Popover onOpenChange={handleOpenChange} open={isOpen}>
				<PopoverAnchor virtualRef={tabWrapperRef} />
				<PopoverContent
					align="start"
					className="p-0 w-72"
					onInteractOutside={onInteractOutside}
					side="right"
					sideOffset={-4}
				>
					<div className="flex items-center justify-between px-3 py-2.5 h-10">
						<span className="text-sm font-semibold">{t("git.history.filters.title")}</span>
						<Button
							className="h-auto p-1 text-xs text-muted font-normal"
							onClick={handleReset}
							size="xs"
							variant="text"
						>
							{t("git.history.filters.reset")}
						</Button>
					</div>
					<Divider />
					<div className="p-3 space-y-4 pb-0">
						<RevisionDateFilter
							onChange={(value) =>
								setFilter({
									...filter,
									afterDate: value.from?.toISOString(),
									beforeDate: value.to?.toISOString(),
								})
							}
							value={dateRange}
						/>
						<Divider />
						<RevisionArticlesFilter
							articles={filter?.articles ?? []}
							onChange={(articles) => setFilter({ ...filter, articles })}
						/>
						<RevisionAuthorsFilter
							onChange={(emails) => setFilter({ ...filter, authors: emails })}
							selectedEmails={filter?.authors ?? null}
						/>
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
});
