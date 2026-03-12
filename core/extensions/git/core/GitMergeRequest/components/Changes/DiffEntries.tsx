import styled from "@emotion/styled";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import DiffEntry from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntry";
import { useDiffExtendedMode } from "@ext/git/core/GitMergeRequest/components/Changes/stores/DiffExtendedModeStore";
import useUpdateArticleDiffView from "@ext/git/core/GitMergeRequest/components/Changes/useUpdateArticleDiffView";
import t from "@ext/localization/locale/translate";
import { useVirtualizer } from "@tanstack/react-virtual";
import { createContext, forwardRef, memo, type RefObject, useCallback, useMemo, useState } from "react";

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
	overflow: hidden;
	${({ hasChanges }) => hasChanges && "margin: 0 -1.6em;"}

	& > div:not(.virtual-spacer) {
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
	changes: DiffFlattenTreeAnyItem[];
	renderCommentsCount: boolean;
	actionIcon?: string;
	scrollableRef: RefObject<HTMLDivElement>;

	setArticleDiffView: (item: DiffFlattenTreeAnyItem) => void;

	selectFile?: (entry: DiffFlattenTreeAnyItem, checked: boolean) => void;
	isFileSelected?: (entry: DiffFlattenTreeAnyItem) => boolean;

	onAction?: (entry: DiffFlattenTreeAnyItem) => void;
};

export const DiffEntries = memo(
	forwardRef<HTMLDivElement, DiffEntriesProps>((props, ref) => {
		const {
			changes,
			selectFile,
			isFileSelected,
			setArticleDiffView,
			onAction,
			actionIcon,
			renderCommentsCount,
			scrollableRef,
		} = props;
		const [selectedByPath, setSelectedByPath] = useState<string>(undefined);
		const extendedMode = useDiffExtendedMode();

		const hasChanges = changes?.length > 0;
		const hasCheckboxes = Boolean(selectFile && isFileSelected);

		useUpdateArticleDiffView({ changes, currentSelectedPath: selectedByPath, setArticleDiffView });

		const onSelect = useCallback(
			(entry: DiffFlattenTreeAnyItem) => {
				if (entry.type === "node") return;
				setSelectedByPath(entry.filepath.new);
				setArticleDiffView(entry);
			},
			[setArticleDiffView],
		);

		const flatChanges: DiffFlattenTreeAnyItem[] = useMemo(() => {
			if (!changes) return [];
			return changes
				.filter((entry) => !(entry.type === "resource" && !extendedMode && entry.indent > 1))
				.map((entry) => ({ ...entry, indent: hasCheckboxes ? entry.indent + 1 : entry.indent }));
		}, [changes, hasCheckboxes, extendedMode]);

		const getItemKey = useCallback(
			(index: number) => {
				const entry = flatChanges[index];
				if (entry.type === "node") return entry.logicpath;
				return `diff-entry-${index}`;
			},
			[flatChanges],
		);

		const virtualList = useVirtualizer({
			count: flatChanges.length,
			getScrollElement: () => scrollableRef.current,
			getItemKey,
			estimateSize: () => 20,
			overscan: 8,
			scrollMargin: 0,
			// i know its magic number, but it works. it should be 20, but it doesn't work.
		});

		const virtualItems = virtualList.getVirtualItems();

		return (
			<SelectedDiffEntryContext.Provider value={{ selectedByPath, setSelectedByPath }}>
				<DiffEntriesWrapper
					hasChanges={hasChanges}
					ref={ref}
					style={{
						paddingTop: `${virtualItems?.[0]?.start ?? 0}px`,
						paddingBottom: `${
							virtualList.getTotalSize() - (virtualItems?.[virtualItems.length - 1]?.end ?? 0)
						}px`,
					}}
				>
					{virtualItems.length > 0 ? (
						<>
							{virtualItems.map((item) => {
								const entry = flatChanges[item.index];
								if (!entry) return <div className="h-5" key={item.key} />;

								return (
									<div className="h-5" key={item.key}>
										<DiffEntry
											actionIcon={actionIcon}
											entry={entry}
											indent={entry.indent}
											isExtendedMode={extendedMode}
											isFileSelected={isFileSelected}
											onAction={onAction}
											onSelect={onSelect}
											renderCommentsCount={renderCommentsCount}
											selectFile={selectFile}
										/>
									</div>
								);
							})}
						</>
					) : (
						!changes?.length && (
							<NoChanges data-qa="qa-no-changes">{t("git.warning.no-changes.title")}</NoChanges>
						)
					)}
				</DiffEntriesWrapper>
			</SelectedDiffEntryContext.Provider>
		);
	}),
);
