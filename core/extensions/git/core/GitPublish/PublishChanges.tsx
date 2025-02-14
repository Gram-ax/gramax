import SpinnerLoader from "@components/Atoms/SpinnerLoader";
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

import { useCallback } from "react";

export type PublishChangesProps = {
	diffTree: DiffTree;
	overview: TotalOverview;
	isLoading: boolean;
	isReady: boolean;
	isSelectedAll: boolean;
	selectAll: (checked: boolean) => void;

	onDiscard: (paths?: string[]) => void;
	canDiscard: boolean;

	selectFile: (file: DiffTreeAnyItem, checked: boolean) => void;
	isFileSelected: (file: DiffTreeAnyItem) => boolean;
	bottom?: JSX.Element;
};

const SelectAllWrapper = styled.div`
	margin-bottom: 0.5rem;
`;

export const PublishChanges = (props: PublishChangesProps) => {
	const {
		diffTree,
		isLoading,
		overview,
		isReady,
		isSelectedAll,
		selectAll,
		onDiscard,
		canDiscard,
		selectFile,
		isFileSelected,
	} = props;

	const setArticleDiffView = useSetArticleDiffView(null, { reference: "HEAD" });

	const onEntryDiscard = useCallback(
		(entry: DiffTreeAnyItem) => {
			if (entry.type === "node") return;
			onDiscard([entry.filepath.new, entry.filepath.old]);
		},
		[onDiscard],
	);

	return (
		<>
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
			<ScrollableDiffEntriesLayout>
				{isLoading ? (
					<SpinnerLoader fullScreen />
				) : (
					<DiffEntries
						changes={diffTree?.tree}
						selectFile={selectFile}
						isFileSelected={isFileSelected}
						setArticleDiffView={setArticleDiffView}
						onAction={onEntryDiscard}
						actionIcon="reply"
					/>
				)}
			</ScrollableDiffEntriesLayout>
		</>
	);
};
