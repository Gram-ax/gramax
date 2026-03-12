import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import styled from "@emotion/styled";
import type {
	DiffFlattenTreeAnyItem,
	DiffTree,
	TotalOverview,
} from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { DiffEntries } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import ScrollableDiffEntriesLayout from "@ext/git/core/GitMergeRequest/components/Changes/ScrollableDiffEntriesLayout";
import SelectAll from "@ext/git/core/GitPublish/SelectAll";
import { Loader } from "@ui-kit/Loader";
import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";
import { useDiffExtendedMode } from "../GitMergeRequest/components/Changes/stores/DiffExtendedModeStore";

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

const SelectAllWrapper = styled.div`
	margin-bottom: 0.5rem;
`;

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
	const setArticleDiffView = useSetArticleDiffView(false, null, "HEAD");

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
				<SelectAllWrapper>
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
				</SelectAllWrapper>
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
						ref={containerRef}
						renderCommentsCount
						scrollableRef={scrollableRef}
						selectFile={selectFile}
						setArticleDiffView={setArticleDiffView}
					/>
				)}
			</ScrollableDiffEntriesLayout>
		</>
	);
};
