import styled from "@emotion/styled";
import type { DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import DiffEntry from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntry";
import t from "@ext/localization/locale/translate";
import type { DiffItemOrResource } from "@ext/VersionControl/model/Diff";
import { createContext, useState } from "react";

export enum DiffEntriesLoadStage {
	NotLoaded,
	Loading,
	Ready,
}

const DiffEntriesWrapper = styled.div`
	display: flex;
	flex-direction: column;
	height: auto;
	flex-shrink: 1;
	margin: 0 -1.6em;

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
	margin-left: 1.4em;
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
	setArticleDiffView: (item: DiffItemOrResource) => void;

	selectFile?: (entry: DiffTreeAnyItem, checked: boolean) => void;
	isFileSelected?: (entry: DiffTreeAnyItem) => boolean;

	onAction?: (entry: DiffTreeAnyItem) => void;
	actionIcon?: string;
};

export const DiffEntries = ({ changes, selectFile, isFileSelected, setArticleDiffView, onAction, actionIcon }: DiffEntriesProps) => {
	const [selectedByPath, setSelectedByPath] = useState<string>(undefined);

	const hasCheckboxes = selectFile && isFileSelected;

	return (
		<SelectedDiffEntryContext.Provider value={{ selectedByPath, setSelectedByPath }}>
			<DiffEntriesWrapper>
				{changes?.length > 0 ? (
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
						/>
					))
				) : (
					<NoChanges>{t("git.warning.no-changes.title")}</NoChanges>
				)}
			</DiffEntriesWrapper>
		</SelectedDiffEntryContext.Provider>
	);
};
