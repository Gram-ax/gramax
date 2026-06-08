import t from "@ext/localization/locale/translate";
import { type ReviewGrouping, type ReviewSortingOrder, useReviewStore } from "@ext/review/logic/store/ReviewStore";
import type { ReviewScope } from "@ext/review/models/ReviewList";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Indicator } from "@ui-kit/Indicator";
import { useCallback } from "react";

const GROUPING_OPTIONS: { value: ReviewGrouping; label: string; scope?: ReviewScope }[] = [
	{ value: "none", label: "editor.modes.grouping.none" },
	{ value: "article", label: "editor.modes.grouping.article", scope: "catalog" },
	{ value: "date", label: "editor.modes.grouping.date" },
];

const SORT_OPTIONS: { value: ReviewSortingOrder; label: string }[] = [
	{ value: "none", label: "editor.modes.sorting.none" },
	{ value: "newest", label: "editor.modes.sorting.newest" },
	{ value: "oldest", label: "editor.modes.sorting.oldest" },
];

export const ReviewSorting = () => {
	const { sorting, setSorting, grouping, setGrouping, currentScope } = useReviewStore((s) => ({
		sorting: s.sorting,
		setSorting: s.setSorting,
		grouping: s.grouping,
		setGrouping: s.setGrouping,
		currentScope: s.currentScope,
	}));

	const groupingValue: ReviewGrouping = ["none", "article"].includes(grouping) ? grouping : "date";
	const sortValue: ReviewSortingOrder = ["newest", "oldest"].includes(sorting) ? sorting : "none";

	const handleGroupingChange = useCallback(
		(value: string) => {
			setGrouping(value as ReviewGrouping);
		},
		[setGrouping],
	);

	const handleSortChange = useCallback(
		(value: string) => {
			setSorting(value as ReviewSortingOrder);
		},
		[setSorting],
	);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTriggerButton
					className="gap-1 text-xs relative px-1.5 py-0.5 -ml-1.5"
					size="xs"
					variant="text"
				>
					<Icon className="h-4 w-4" icon="layout-grid" />
					{groupingValue !== "none" && (
						<Indicator className="rounded-full absolute right-0.5 top-0.5 bg-status-info" size="sm" />
					)}
				</DropdownMenuTriggerButton>
				<DropdownMenuContent>
					<DropdownMenuLabel>{t("editor.modes.grouping.title")}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuRadioGroup onValueChange={handleGroupingChange} value={groupingValue}>
						{GROUPING_OPTIONS.map((opt) => (
							<DropdownMenuRadioItem
								disabled={opt.scope && opt.scope !== currentScope}
								key={opt.value}
								value={opt.value}
							>
								{t(opt.label as keyof typeof t)}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<DropdownMenu>
				<DropdownMenuTriggerButton className="gap-1 text-xs relative px-1.5 py-0.5" size="xs" variant="text">
					<Icon className="h-4 w-4" icon="arrow-down-wide-narrow" />
					{sortValue !== "none" && (
						<Indicator className="rounded-full absolute right-0.5 top-0.5 bg-status-info" size="sm" />
					)}
				</DropdownMenuTriggerButton>
				<DropdownMenuContent>
					<DropdownMenuLabel>{t("editor.modes.sorting.title")}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuRadioGroup onValueChange={handleSortChange} value={sortValue}>
						{SORT_OPTIONS.map((opt) => (
							<DropdownMenuRadioItem key={opt.value} value={opt.value}>
								{t(opt.label as keyof typeof t)}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};
