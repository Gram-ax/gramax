import resolveTabHeight from "@components/Layouts/StatusBar/Extensions/logic/resolveTabHeight";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { RevisionListItem } from "@ext/git/actions/Revisions/components/RevisionsList/RevisionListItem";
import { useRevisionCatalogStore } from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import t from "@ext/localization/locale/translate";
import { defaultRangeExtractor, type Range, useVirtualizer } from "@tanstack/react-virtual";
import { EmptyState } from "@ui-kit/EmptyState";
import { LoadMoreTrigger } from "@ui-kit/LoadMoreTrigger";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { Stepper } from "@ui-kit/Stepper";
import { type RefObject, useCallback, useEffect, useRef } from "react";

interface RevisionCommitsListProps {
	revisions: GitVersionData[];
	currentRevision: string;
	shouldLoadMoreAtScrollEnd: boolean;
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	diffTree: DiffTree;
	isDiffTreeLoading: boolean;
	setContentHeight: (height: number) => void;
	requestMore?: (lastRevision: string) => void | Promise<void>;
	onClick?: (revision: string) => void;
}

const RevisionCommitsList = (props: RevisionCommitsListProps) => {
	const {
		revisions,
		currentRevision,
		shouldLoadMoreAtScrollEnd,
		requestMore,
		show,
		tabWrapperRef,
		setContentHeight,
		diffTree,
		isDiffTreeLoading,
		onClick,
	} = props;

	const scrollRef = useRef<HTMLDivElement>(null);
	const openPopoverIndexRef = useRef<number | null>(null);

	const { fromOid, toOid, scrollY, setScrollY } = useRevisionCatalogStore((state) => ({
		fromOid: state.revisionsCompare?.from?.oid,
		toOid: state.revisionsCompare?.to?.oid,
		scrollY: state.scrollY,
		setScrollY: state.setScrollY,
	}));

	const handlePopoverOpenChange = useCallback((index: number, open: boolean) => {
		openPopoverIndexRef.current = open ? index : null;
	}, []);

	const rangeExtractor = useCallback((range: Range) => {
		const result = defaultRangeExtractor(range);
		const pinned = openPopoverIndexRef.current;
		if (pinned !== null && !result.includes(pinned)) {
			return [...result, pinned].sort((a, b) => a - b);
		}
		return result;
	}, []);

	const virtualizer = useVirtualizer({
		count: revisions?.length ?? 0,
		overscan: 10,
		estimateSize: () => 77,
		getScrollElement: () => scrollRef.current,
		rangeExtractor,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!tabWrapperRef.current || !show) return;
		const newHeight = resolveTabHeight(tabWrapperRef.current);
		const oldHeight = tabWrapperRef.current.getBoundingClientRect().height;
		setContentHeight(Math.max(newHeight, oldHeight));
	}, [tabWrapperRef.current, show, revisions]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: restore scroll position on mount
	useEffect(() => {
		if (!show || !scrollY) return;
		virtualizer.scrollToOffset(scrollY);
	}, [show]);

	const { start: onScrollDebounced } = useDebounce(() => setScrollY(virtualizer.scrollElement.scrollTop), 150);

	const virtualItems = virtualizer.getVirtualItems();
	const sortedItems = [...virtualItems].sort((a, b) => a.index - b.index);

	if (Array.isArray(revisions) && !revisions?.length) return <EmptyState>{t("git.history.error.empty")}</EmptyState>;

	return (
		<ScrollShadowContainer data-commits-list onScroll={onScrollDebounced} ref={scrollRef} role="listbox">
			<Stepper
				className="relative max-w-full overflow-hidden w-full gap-0"
				orientation="vertical"
				style={{ height: `${virtualizer.getTotalSize()}px` }}
				value={null}
			>
				{sortedItems.map((item) => (
					<div
						className="absolute top-0 left-0 w-full"
						key={item.key}
						style={{ transform: `translateY(${item.start}px)` }}
					>
						<RevisionListItem
							diffTree={diffTree}
							isDiffTreeLoading={isDiffTreeLoading}
							last={item.index === revisions?.length - 1}
							onClick={() => onClick?.(revisions[item.index].oid)}
							onPopoverOpenChange={(open) => handlePopoverOpenChange(item.index, open)}
							revision={revisions[item.index]}
							selected={revisions[item.index].oid === currentRevision}
							variant={
								fromOid === revisions[item.index].oid
									? "yellow"
									: toOid === revisions[item.index].oid
										? "green"
										: undefined
							}
						/>
					</div>
				))}
			</Stepper>
			<LoadMoreTrigger
				className="p-6"
				hasMore={shouldLoadMoreAtScrollEnd}
				loadingText={t("loading")}
				onLoad={() => requestMore?.(revisions?.[revisions?.length - 1]?.oid)}
			/>
		</ScrollShadowContainer>
	);
};

export default RevisionCommitsList;
