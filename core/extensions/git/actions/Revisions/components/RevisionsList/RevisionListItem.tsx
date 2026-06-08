import Date from "@components/Atoms/Date";
import { RevisionBadge } from "@ext/git/actions/Revisions/components/RevisionsTab/Helpers/RevisionBadge";
import RevisionsDiffView from "@ext/git/actions/Revisions/components/RevisionsTab/RevisionsDiffView";
import { useGotoRevision } from "@ext/git/actions/Revisions/logic/hooks/useGotoRevision";
import { useRevisionListItemPopover } from "@ext/git/actions/Revisions/logic/hooks/useRevisionListItemPopover";
import { useRevisionCatalogStore } from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import { DiffBar } from "@ext/git/core/Diff/components/helpers/DiffBar";
import { DiffCount } from "@ext/git/core/Diff/components/helpers/DiffCount";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import t from "@ext/localization/locale/translate";
import { AvatarFallback, AvatarLabel, AvatarLabelAvatar, AvatarLabelTitle, getAvatarFallback } from "@ui-kit/Avatar";
import { MenuItem } from "@ui-kit/MenuItem";
import { Popover, PopoverAnchor, PopoverContent } from "@ui-kit/Popover";
import { StepperIndicator, StepperItem, StepperSeparator, StepperTrigger } from "@ui-kit/Stepper";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { forwardRef, type HTMLAttributes, memo, useCallback } from "react";
import { tv } from "tailwind-variants";

type RevisionBaseProps = {
	variant?: "yellow" | "green";
	selected?: boolean;
	last?: boolean;
};

type RevisionListItemComponentProps = GitVersionData & RevisionBaseProps & HTMLAttributes<HTMLDivElement>;

type RevisionListItemProps = RevisionBaseProps & {
	revision: GitVersionData;
	isDiffTreeLoading: boolean;
	diffTree: DiffTree;
	onClick?: () => void;
	onPopoverOpenChange?: (open: boolean) => void;
};

const revisionListItemVariants = tv({
	base: [
		"not-last:flex-1 relative min-w-0 w-full bg-transparent rounded-none",
		"border border-transparent aria-expanded:bg-secondary-bg-hover hover:bg-secondary-bg-hover",
	],
	slots: {
		indicator: "size-3 ml-3.5 mt-2.5 border-primary-border border bg-transparent z-10",
		separator: [
			"absolute top-[1.35rem] bottom-0 left-5 -order-1 m-0 -translate-x-1/2 bg-primary-border shrink-0",
			"group-data-[orientation=vertical]/stepper:h-[calc(100%-0.75rem)] group-data-[orientation=horizontal]/stepper:w-full group-data-[orientation=horizontal]/stepper:flex-none",
			"pointer-events-none group-data-[orientation=vertical]/stepper:w-px z-10",
		],
	},
	variants: {
		selected: {
			true: "",
		},
		variant: {
			yellow: "",
			green: "",
		},
	},
	compoundSlots: [
		{
			slots: ["indicator"],
			selected: true,
			class: "border-[var(--color-status-modified)] border-4",
		},
		{
			slots: ["base"],
			variant: ["yellow", "green"],
			class: "bg-primary-bg-hover",
		},
		{
			slots: ["base"],
		},
		{
			slots: ["indicator"],
			variant: "yellow",
			class: "border-[hsl(var(--status-warning-hover))] border-4",
		},
		{
			slots: ["indicator"],
			variant: "green",
			class: "border-[hsl(var(--status-success-hover))] border-4",
		},
	],
});

const RevisionListItemComponent = forwardRef<HTMLDivElement, RevisionListItemComponentProps>((props, ref) => {
	const { author, timestamp, oid, summary, parents, stat, last, selected, variant, onClick, ...rest } = props;
	const { indicator, base, separator } = revisionListItemVariants({ variant });
	const articles = stat.changedFiles;

	return (
		<StepperItem className="relative w-full focus-visible:ring-0" onClick={onClick}>
			<StepperTrigger className="items-start rounded w-full gap-1 focus-visible:ring-0">
				<StepperIndicator className={indicator({ selected })} />
				<MenuItem className={base({ selected, variant })} ref={ref} {...rest}>
					<div className="w-full min-w-0">
						<div className="flex items-center gap-2 w-full">
							<AvatarLabel className="flex-1 min-w-0" size="2xs">
								<AvatarLabelAvatar>
									<AvatarFallback uniqueId={author.email ?? ""}>
										{getAvatarFallback(author.name ?? author.email ?? "")}
									</AvatarFallback>
								</AvatarLabelAvatar>
								<AvatarLabelTitle className="font-medium truncate">
									{author.name ?? ""}
								</AvatarLabelTitle>
							</AvatarLabel>
							<span className="text-muted text-xs whitespace-nowrap shrink-0">
								<Date date={timestamp} />
							</span>
						</div>
						<div className="text-left mt-1">
							<div className="flex items-center">
								<TextOverflowTooltip className="text-secondary-fg text-xs font-normal">
									{articles?.[0] ? articles[0].title || t("article.no-name") : summary}
								</TextOverflowTooltip>
								{articles?.length > 1 && (
									<span className="text-xs text-muted shrink-0 font-normal">
										{t("git.revisions.n-more").replace("{count}", String(articles.length - 1))}
									</span>
								)}
							</div>
							<div className="flex items-center gap-1 mt-1">
								<DiffCount className="text-[11px]" type="added">
									+{stat.added}
								</DiffCount>
								<DiffCount className="text-[11px]" type="deleted">
									-{stat.deleted}
								</DiffCount>
								<DiffBar
									added={stat.added}
									className="ml-2 w-12"
									deleted={stat.deleted}
									segments={4}
									size="sm"
								/>
								{variant && (
									<RevisionBadge className="ml-auto" revision={variant === "green" ? "B" : "A"} />
								)}
							</div>
						</div>
					</div>
				</MenuItem>
			</StepperTrigger>
			{!last && <StepperSeparator className={separator({ selected })} />}
		</StepperItem>
	);
});

export const RevisionListItem = memo((props: RevisionListItemProps) => {
	const { revision, last, selected, onClick, isDiffTreeLoading, diffTree, onPopoverOpenChange, variant } = props;

	const gotoRevision = useGotoRevision();
	const status = useRevisionCatalogStore((state) => state.status);

	const {
		open,
		frozenRect,
		triggerRef,
		contentRef,
		handleOpenChange,
		handleTriggerMouseEnter,
		handleTriggerMouseLeave,
		handleContentMouseEnter,
		handleContentMouseLeave,
		onFocusOutside,
		onInteractOutside,
	} = useRevisionListItemPopover({ onOpen: onClick, onOpenChange: onPopoverOpenChange });

	const handleClick = useCallback(() => {
		onClick?.();
		if (status === "comparing") return;
		gotoRevision(revision.oid);
	}, [gotoRevision, revision.oid, status, onClick]);

	return (
		<>
			<RevisionListItemComponent
				{...revision}
				aria-expanded={open}
				last={last}
				onClick={handleClick}
				onMouseEnter={handleTriggerMouseEnter}
				onMouseLeave={handleTriggerMouseLeave}
				ref={triggerRef}
				selected={selected}
				variant={variant}
			/>
			<Popover onOpenChange={handleOpenChange} open={open}>
				<PopoverAnchor
					virtualRef={{
						current: {
							getBoundingClientRect: () =>
								frozenRect ?? triggerRef.current?.getBoundingClientRect() ?? new DOMRect(),
						},
					}}
				/>
				<PopoverContent
					align="start"
					className="p-0 w-[20rem] max-w-[var(--radix-popover-content-available-width)] max-h-[min(var(--radix-popper-available-height),45dvh)] overflow-hidden"
					onFocusOutside={onFocusOutside}
					onInteractOutside={onInteractOutside}
					onMouseEnter={handleContentMouseEnter}
					onMouseLeave={handleContentMouseLeave}
					onOpenAutoFocus={(e) => e.preventDefault()}
					ref={contentRef}
					side="right"
					sideOffset={0}
				>
					<RevisionsDiffView
						commitData={revision}
						diffTree={diffTree}
						isDiffTreeLoading={isDiffTreeLoading}
						revision={revision.oid}
					/>
				</PopoverContent>
			</Popover>
		</>
	);
});
