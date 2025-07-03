import styled from "@emotion/styled";
import type { DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import DiffEntry from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntry";
import useUpdateArticleDiffView from "@ext/git/core/GitMergeRequest/components/Changes/useUpdateArticleDiffView";
import t from "@ext/localization/locale/translate";
import type { DiffItemOrResource } from "@ext/VersionControl/model/Diff";
import { createContext, forwardRef, useState } from "react";

export enum DiffEntriesLoadStage {
	NotLoaded,
	Loading,
	Ready,
}

const DiffEntriesWrapper = styled.div<{ hasChanges: boolean }>`
	display: flex;
	flex-direction: column;
	height: auto;
	flex-shrink: 1;
	${({ hasChanges }) => hasChanges && "margin: 0 -1.6em;"}

	& > div {
		padding-left: 1rem;
		padding-right: 1rem;
	}

	scrollbar-width: none;
	-ms-overflow-style: none;
	::-webkit-scrollbar {
		display: none;
	}
`;

const NoChanges = styled.div`
	color: var(--color-merge-request-text);
	opacity: 0.8;
	text-align: center;
	padding: 24px 0;
	padding-top: calc(24px - 0.5rem);
	padding-bottom: calc(24px + 0.5rem);
	font-size: 14px;
`;

export const SelectedDiffEntryContext = createContext<{
	selectedByPath: string;
	setSelectedByPath: (path: string) => void;
}>({
	selectedByPath: undefined,
	setSelectedByPath: () => {},
});

export type DiffEntriesProps = {
	changes: DiffTreeAnyItem[];
	renderCommentsCount: boolean;
	setArticleDiffView: (item: DiffItemOrResource) => void;

	selectFile?: (entry: DiffTreeAnyItem, checked: boolean) => void;
	isFileSelected?: (entry: DiffTreeAnyItem) => boolean;

	onAction?: (entry: DiffTreeAnyItem) => void;
	actionIcon?: string;
};

export const DiffEntries = forwardRef<HTMLDivElement, DiffEntriesProps>((props, ref) => {
	const { changes, selectFile, isFileSelected, setArticleDiffView, onAction, actionIcon, renderCommentsCount } =
		props;
	const [selectedByPath, setSelectedByPath] = useState<string>(undefined);
	const hasChanges = changes?.length > 0;

	const hasCheckboxes = selectFile && isFileSelected;

	useUpdateArticleDiffView({ changes, currentSelectedPath: selectedByPath, setArticleDiffView });

	return (
		<SelectedDiffEntryContext.Provider value={{ selectedByPath, setSelectedByPath }}>
			<DiffEntriesWrapper ref={ref} hasChanges={hasChanges}>
				{hasChanges ? (
					changes.map((entry, id) => (
						<DiffEntry
							key={id}
							entry={entry}
							indent={hasCheckboxes ? 1 : 0}
							onSelect={(entry) => {
								if (entry.type === "node") return;
								setSelectedByPath(entry.filepath.new);
								setArticleDiffView(entry.rawItem);
							}}
							onAction={onAction}
							actionIcon={actionIcon}
							selectFile={selectFile}
							isFileSelected={isFileSelected}
							renderCommentsCount={renderCommentsCount}
						/>
					))
				) : (
					<NoChanges data-qa="qa-no-changes">{t("git.warning.no-changes.title")}</NoChanges>
				)}
			</DiffEntriesWrapper>
		</SelectedDiffEntryContext.Provider>
	);
});
