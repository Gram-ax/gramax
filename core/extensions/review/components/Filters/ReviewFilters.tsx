import t from "@ext/localization/locale/translate";
import { ReviewAuthorsFilter } from "@ext/review/components/Filters/ReviewAuthorsFilter";
import { ReviewDateFilter } from "@ext/review/components/Filters/ReviewDateFilter";
import { useReviewStore } from "@ext/review/logic/store/ReviewStore";
import { Button, TriggerButton } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Icon } from "@ui-kit/Icon";
import { Indicator } from "@ui-kit/Indicator";
import { Popover, PopoverAnchor, PopoverContent } from "@ui-kit/Popover";
import { type RefObject, useMemo, useState } from "react";

export const ReviewFilters = ({ tabRef }: { tabRef: RefObject<HTMLDivElement> }) => {
	const [isOpen, setIsOpen] = useState(false);
	const { filters, setFilters } = useReviewStore((s) => ({
		filters: s.filters,
		setFilters: s.setFilters,
	}));

	const hasActiveFilters = useMemo(() => {
		return filters.afterDate || filters.beforeDate || filters.authors?.length;
	}, [filters.afterDate, filters.beforeDate, filters.authors]);

	return (
		<>
			<TriggerButton
				className="relative text-xs shrink-0 px-1.5 py-0.5"
				data-state={isOpen ? "open" : "closed"}
				onClick={() => setIsOpen((prev) => !prev)}
				size="xs"
				variant="text"
			>
				<Icon className="h-4 w-4" icon="filter" />
				{hasActiveFilters && (
					<Indicator className="rounded-full absolute right-0.5 top-0.5 bg-status-info" size="sm" />
				)}
			</TriggerButton>
			<Popover modal onOpenChange={setIsOpen} open={isOpen}>
				<PopoverAnchor virtualRef={tabRef} />
				<PopoverContent align="start" className="p-0 w-72" side="left" sideOffset={-4}>
					<div className="flex items-center justify-between px-3 py-2.5">
						<span className="text-sm font-semibold">{t("editor.modes.filters.title")}</span>
						<Button
							className="h-auto p-1 text-xs text-muted font-normal"
							onClick={() => setFilters({})}
							size="xs"
							variant="text"
						>
							{t("clear")}
						</Button>
					</div>
					<Divider />
					<div className="p-3 pb-0 space-y-4">
						<ReviewDateFilter
							onChange={(value) =>
								setFilters({
									...filters,
									afterDate: value.from?.toISOString(),
									beforeDate: value.to?.toISOString(),
								})
							}
							value={{
								from: filters.afterDate ? new Date(filters.afterDate) : null,
								to: filters.beforeDate ? new Date(filters.beforeDate) : null,
							}}
						/>
						<Divider />
						<ReviewAuthorsFilter
							onChange={(emails) => setFilters({ ...filters, authors: emails })}
							selectedEmails={filters.authors ?? null}
						/>
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
};
