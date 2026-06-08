import Date from "@components/Atoms/Date";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import {
	type RevisionCommit,
	RevisionCompareBlankItem,
	RevisionCompareItem,
	type RevisionVariant,
} from "@ext/git/actions/Revisions/components/RevisionsTab/Compare/RevisionCompareItem";
import { useRevisionsCompare } from "@ext/git/actions/Revisions/logic/hooks/useRevisionsCompare";
import {
	revisionCatalogStore,
	useRevisionCatalogStore,
} from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import { DiffEntries } from "@ext/git/core/Diff/components/Changes/DiffEntries";
import ScrollableDiffEntriesLayout from "@ext/git/core/Diff/components/Changes/ScrollableDiffEntriesLayout";
import { DiffCount } from "@ext/git/core/Diff/components/helpers/DiffCount";
import type { DiffFlattenTreeItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import t, { pluralize } from "@ext/localization/locale/translate";
import { Button, TriggerButton } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Icon } from "@ui-kit/Icon";
import { Indicator } from "@ui-kit/Indicator";
import { Loader } from "@ui-kit/Loader";
import { Popover, PopoverAnchor, PopoverContent } from "@ui-kit/Popover";
import { TextOverflowTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type RefObject, useCallback, useMemo, useRef, useState } from "react";

const CompareItemContent = ({ variant, circle }: { variant: RevisionVariant; circle: RevisionCommit }) => {
	const fieldName = circle === "A" ? "from" : "to";
	const revision = useRevisionCatalogStore((state) => state.revisionsCompare?.[fieldName] ?? null);

	const onClearClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			const current = revisionCatalogStore.getState().revisionsCompare;
			revisionCatalogStore.getState().setRevisionsCompare({
				from: current?.from ?? null,
				to: current?.to ?? null,
				[fieldName]: null,
			});
		},
		[fieldName],
	);

	if (!revision) {
		return (
			<RevisionCompareBlankItem
				circle={circle}
				title={t("git.history.revisions.pick-a-commit")}
				variant={variant}
			/>
		);
	}

	const articles = revision?.stat?.changedFiles;

	const title = (
		<div className="flex flex-col min-w-0">
			<div className="flex items-center font-medium gap-1 min-w-0 overflow-hidden">
				<TextOverflowTooltip className="align-bottom whitespace-nowrap">
					{revision.author.name}
				</TextOverflowTooltip>
			</div>
			<span className="font-medium flex items-center gap-1 text-muted min-w-0">
				<TextOverflowTooltip className="font-normal truncate min-w-0">
					{articles?.[0] ? articles[0].title || t("article.no-name") : revision.summary}
				</TextOverflowTooltip>
				<span className="shrink-0">·</span>
				<Date className="text-xs text-muted whitespace-nowrap shrink-0" date={revision.timestamp} />
			</span>
		</div>
	);

	return <RevisionCompareItem circle={circle} onClearClick={onClearClick} selected title={title} variant={variant} />;
};

const CompareResults = () => {
	const scrollableRef = useRef<HTMLDivElement>(null);
	const entriesRef = useRef<HTMLDivElement>(null);

	const { isLoading: isCompareLoading } = useRevisionsCompare();

	const { compareDiffTree, revisionsCompare } = useRevisionCatalogStore((state) => ({
		compareDiffTree: state.compareDiffTree,
		revisionsCompare: state.revisionsCompare,
	}));

	const [newerScope, olderScope] = (() => {
		const from = revisionsCompare?.from;
		const to = revisionsCompare?.to;
		if (!from || !to) return [null, null];
		const [older, newer] = from.timestamp < to.timestamp ? [from, to] : [to, from];
		return [{ commit: newer.oid }, { commit: older.oid }];
	})();
	const setArticleDiffView = useSetArticleDiffView(newerScope, olderScope);

	const { totalAdded, totalRemoved } = useMemo(() => {
		if (!compareDiffTree?.data) return { totalAdded: 0, totalRemoved: 0 };
		let totalAdded = 0;
		let totalRemoved = 0;
		for (const item of compareDiffTree.data) {
			if (item.type === "node") continue;
			const flatItem = item as DiffFlattenTreeItem;
			totalAdded += flatItem.overview?.added ?? 0;
			totalRemoved += flatItem.overview?.removed ?? 0;
		}
		return { totalAdded, totalRemoved };
	}, [compareDiffTree]);

	const filesCount = compareDiffTree?.data?.filter((i) => i.type !== "node").length ?? 0;

	const pluralizeFilesCount = pluralize(
		filesCount,
		{
			one: t("files.one"),
			many: t("files.many"),
			few: t("files.few"),
		},
		false,
	);

	return (
		<>
			<Divider />
			<div className="flex items-center gap-2 px-3 py-2 text-xs">
				<span className="font-medium uppercase text-muted text-xs">{t("git.merge-requests.diff")}</span>
				<DiffCount type="added">+{totalAdded}</DiffCount>
				<DiffCount type="deleted">-{totalRemoved}</DiffCount>
				<span className="ml-auto text-muted shrink-0">
					{filesCount} {pluralizeFilesCount}
				</span>
			</div>
			<Divider />
			<div className="text-xs">
				<ScrollableDiffEntriesLayout maxHeight="20vh" ref={scrollableRef}>
					{!isCompareLoading ? (
						<DiffEntries
							changes={compareDiffTree?.data}
							noNegativeMargin
							onClick={setArticleDiffView}
							ref={entriesRef}
							renderCommentsCount
							scrollableRef={scrollableRef}
						/>
					) : (
						<Loader className="p-6" size="md">
							{t("loading")}
						</Loader>
					)}
				</ScrollableDiffEntriesLayout>
			</div>
		</>
	);
};

export const RevisionsCompare = ({ tabWrapperRef }: { tabWrapperRef: RefObject<HTMLDivElement> }) => {
	const [isOpen, setIsOpen] = useState(false);

	const { setStatus, setRevisionsCompare, setCompareDiffTree } = useRevisionCatalogStore((state) => ({
		setStatus: state.setStatus,
		setRevisionsCompare: state.setRevisionsCompare,
		setCompareDiffTree: state.setCompareDiffTree,
	}));

	const { hasFrom, hasTo } = useRevisionCatalogStore((state) => ({
		hasFrom: !!state.revisionsCompare?.from,
		hasTo: !!state.revisionsCompare?.to,
	}));

	const hasAny = hasFrom || hasTo;

	const onReset = useCallback(() => {
		setRevisionsCompare({ from: null, to: null });
	}, [setRevisionsCompare]);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			setStatus(open ? "comparing" : "default");
			if (open) return;

			setCompareDiffTree(null);
			onReset();
		},
		[setStatus, setCompareDiffTree, onReset],
	);

	const onInteractOutside = useCallback((event) => {
		const isRevisionsComparePopover = event.target.closest("[aria-controls='revisions-compare-popover']");
		if (event.target.closest("[data-commits-list]") || isRevisionsComparePopover) {
			event.preventDefault();
			return;
		}
	}, []);

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<TriggerButton
						aria-controls="revisions-compare-popover"
						className="relative shrink-0 ml-auto"
						data-state={isOpen ? "open" : "closed"}
						onClick={() => handleOpenChange(!isOpen)}
						size="xs"
						variant="text"
					>
						<Icon className="h-4 w-4" icon="git-compare-arrows" />
						{hasAny && (
							<Indicator className="rounded-full absolute right-1.5 top-1 bg-status-info" size="xs" />
						)}
					</TriggerButton>
				</TooltipTrigger>
				<TooltipContent>{t("git.history.revisions.title")}</TooltipContent>
			</Tooltip>
			<Popover onOpenChange={handleOpenChange} open={isOpen}>
				<PopoverAnchor virtualRef={tabWrapperRef} />
				<PopoverContent
					align="start"
					className="p-0 w-72 pb-0 overflow-hidden"
					onInteractOutside={onInteractOutside}
					side="right"
					sideOffset={-4}
				>
					<div className="flex items-center justify-between px-3 py-2.5 h-10">
						<span className="text-sm font-semibold">{t("git.history.revisions.title")}</span>
						{hasAny && (
							<Button
								className="h-auto p-1 text-xs text-muted font-normal"
								onClick={onReset}
								size="xs"
								variant="text"
							>
								{t("git.history.revisions.reset")}
							</Button>
						)}
					</div>
					<Divider />
					<div className="p-3">
						<CompareItemContent circle="A" variant="yellow" />
						<Divider
							className="ml-[1.4rem] h-4 w-0 bg-transparent border border-dashed border-primary-border border-r-0"
							orientation="vertical"
						/>
						<CompareItemContent circle="B" variant="green" />
					</div>
					{!hasFrom || !hasTo ? (
						<>
							<Divider />
							<div className="p-3 py-6 text-muted text-center">
								<div className="text-xs font-normal">{t("git.history.revisions.hint1")}</div>
								<div className="text-xs font-normal">{t("git.history.revisions.hint2")}</div>
							</div>
						</>
					) : (
						<CompareResults />
					)}
				</PopoverContent>
			</Popover>
		</>
	);
};
