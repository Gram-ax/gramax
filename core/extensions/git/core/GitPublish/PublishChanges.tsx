import SpinnerLoaderSrc from "@components/Atoms/SpinnerLoader";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import styled from "@emotion/styled";
import type {
	DiffTree,
	DiffTreeAnyItem,
	TotalOverview,
} from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { DiffEntries } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import ScrollableDiffEntriesLayout from "@ext/git/core/GitMergeRequest/components/Changes/ScrollableDiffEntriesLayout";
import SelectAll from "@ext/git/core/GitPublish/SelectAll";

import { RefObject, useCallback, useLayoutEffect, useRef } from "react";

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

	selectFile: (file: DiffTreeAnyItem, checked: boolean) => void;
	isFileSelected: (file: DiffTreeAnyItem) => boolean;
	setContentHeight: (height: number) => void;
	bottom?: JSX.Element;
};

const SelectAllWrapper = styled.div`
	margin-bottom: 0.5rem;
`;

const SpinnerLoader = styled(SpinnerLoaderSrc)`
	margin-bottom: 1rem;
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
	const containerRef = useRef<HTMLDivElement>(null);
	const setArticleDiffView = useSetArticleDiffView(false, null, "HEAD");

	const onEntryDiscard = useCallback(
		(entry: DiffTreeAnyItem) => {
			if (entry.type === "node") return;
			const filePaths = [entry.filepath.new, entry.filepath.old];
			if (entry.type === "item" && entry.childs?.length) {
				entry.childs.forEach((c) => {
					if (c.type !== "resource") return;
					filePaths.push(c.filepath.new, c.filepath.old);
				});
			}
			onDiscard(filePaths);
		},
		[onDiscard],
	);

	useLayoutEffect(() => {
		if (!containerRef.current || !tabWrapperRef.current || !show) return;
		const mainElement = tabWrapperRef.current;
		const firstChild = containerRef.current.firstElementChild as HTMLElement;
		const isSpinner = firstChild.dataset.qa === "loader";

		if (!mainElement && !isSpinner) return;
		const height =
			calculateTabWrapperHeight(mainElement) - parseFloat(getComputedStyle(document.documentElement).fontSize);

		setContentHeight(height);
	}, [diffTree?.tree, containerRef.current, tabWrapperRef.current, isLoading, show]);

	const hasChanges = diffTree?.tree?.length > 0;

	return (
		<>
			{hasChanges && (
				<SelectAllWrapper>
					<SelectAll
						isSelectedAll={isSelectedAll}
						canDiscard={canDiscard}
						onDiscard={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onDiscard();
						}}
						onSelectAll={selectAll}
						overview={<Overview showTotal fontSize="12px" {...overview} />}
					/>
				</SelectAllWrapper>
			)}
			<ScrollableDiffEntriesLayout>
				{!diffTree?.tree && isLoading ? (
					<SpinnerLoader ref={containerRef} fullScreen />
				) : (
					<DiffEntries
						ref={containerRef}
						changes={diffTree?.tree}
						selectFile={selectFile}
						isFileSelected={isFileSelected}
						setArticleDiffView={setArticleDiffView}
						onAction={onEntryDiscard}
						actionIcon="reply"
						renderCommentsCount
					/>
				)}
			</ScrollableDiffEntriesLayout>
		</>
	);
};
