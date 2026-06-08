import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import { DiffEntries } from "@ext/git/core/Diff/components/Changes/DiffEntries";
import { Overview } from "@ext/git/core/Diff/components/Changes/Overview";
import ScrollableDiffEntriesLayout from "@ext/git/core/Diff/components/Changes/ScrollableDiffEntriesLayout";
import type {
	DiffFlattenTreeAnyItem,
	DiffTree,
	TotalOverview,
} from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import SelectAll from "@ext/git/core/GitPublish/SelectAll";
import { Loader } from "@ui-kit/Loader";
import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";
import { useDiffExtendedMode } from "../Diff/components/store/DiffExtendedModeStore";

export type PublishChangesProps = {
	diffTree: DiffTree;
	overview: TotalOverview;
	isLoading: boolean;
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	isReady: boolean;
	isSelectedAll: boolean;
	selectAll: (checked: boolean) => void;

	onDiscard: (paths?: string[]) => void;
	canDiscard: boolean;

	selectFile: (file: DiffFlattenTreeAnyItem, checked: boolean) => void;
	isFileSelected: (file: DiffFlattenTreeAnyItem) => boolean;
	setContentHeight: (height: number) => void;
	bottom?: JSX.Element;
};

export const PublishChanges = (props: PublishChangesProps) => {
	const {
		diffTree,
		show,
		isLoading,
		overview,
		isSelectedAll,
		selectAll,
		onDiscard,
		canDiscard,
		selectFile,
		isFileSelected,
		tabWrapperRef,
		setContentHeight,
	} = props;
	const extendedMode = useDiffExtendedMode();
	const containerRef = useRef<HTMLDivElement>(null);
	const scrollableRef = useRef<HTMLDivElement>(null);
	const setArticleDiffView = useSetArticleDiffView(null, "HEAD");

	const onEntryDiscard = useCallback(
		(entry: DiffFlattenTreeAnyItem) => {
			if (entry.type === "node") return;
			const filePaths = [entry.filepath.new, entry.filepath.old];
			if (entry.type === "item" && entry.resources) {
				entry.resources.forEach((resource) => {
					filePaths.push(resource.filePath.path, resource.filePath.oldPath);
				});
			}
			onDiscard(filePaths);
		},
		[onDiscard],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: needs to calculate height of the tab wrapper
	useLayoutEffect(() => {
		if (!containerRef.current || !tabWrapperRef.current || !show) return;
		const mainElement = tabWrapperRef.current;
		const firstChild = containerRef.current.firstElementChild as HTMLElement;
		const isSpinner = firstChild?.dataset?.qa === "loader";

		if (!mainElement && !isSpinner) return;
		const height =
			calculateTabWrapperHeight(mainElement) - parseFloat(getComputedStyle(document.documentElement).fontSize);

		setContentHeight(height);
	}, [diffTree?.data, containerRef.current, extendedMode, tabWrapperRef.current, isLoading, show]);

	const hasChanges = diffTree?.data?.length > 0;

	return (
		<>
			{hasChanges && (
				<div className="mb-2">
					<SelectAll
						canDiscard={canDiscard}
						isSelectedAll={isSelectedAll}
						onDiscard={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onDiscard();
						}}
						onSelectAll={selectAll}
						overview={<Overview fontSize="12px" showTotal {...overview} />}
					/>
				</div>
			)}
			<ScrollableDiffEntriesLayout ref={scrollableRef}>
				{isLoading ? (
					<Loader className="py-6" ref={containerRef} size="3xl" />
				) : (
					<DiffEntries
						actionIcon="reply"
						changes={diffTree?.data}
						isFileSelected={isFileSelected}
						onAction={onEntryDiscard}
						onClick={setArticleDiffView}
						ref={containerRef}
						renderCommentsCount
						scrollableRef={scrollableRef}
						selectFile={selectFile}
					/>
				)}
			</ScrollableDiffEntriesLayout>
		</>
	);
};
