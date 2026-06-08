import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import Breadcrumbs from "@ext/git/core/Diff/components/Changes/Breadcrumbs";
import { DiffCheckbox } from "@ext/git/core/Diff/components/Changes/DiffCheckbox";
import { SelectedDiffEntryContext } from "@ext/git/core/Diff/components/Changes/DiffEntries";
import DiffEntryAction from "@ext/git/core/Diff/components/Changes/DiffEntryAction";
import DiffEntryHighlight from "@ext/git/core/Diff/components/Changes/DiffEntryHighlight";
import DiffEntryIndent from "@ext/git/core/Diff/components/Changes/DiffEntryIndent";
import DiffEntryLfsIcon from "@ext/git/core/Diff/components/Changes/DiffEntryLfsIcon";
import DiffEntryTitle, { DiffEntryTitleTooltip } from "@ext/git/core/Diff/components/Changes/DiffEntryTitle";
import IndentLine from "@ext/git/core/Diff/components/Changes/IndentLine";
import { Overview } from "@ext/git/core/Diff/components/Changes/Overview";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import t from "@ext/localization/locale/translate";
import CommentCount from "@ext/markdown/elements/comment/edit/components/CommentCount";
import { useGetTotalCommentsByPathname } from "@ext/markdown/elements/comment/edit/logic/stores/CommentsStore";
import { Icon } from "@ui-kit/Icon";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { memo, useCallback, useContext } from "react";

export type DiffEntryProps = {
	entry: DiffFlattenTreeAnyItem;
	renderCommentsCount: boolean;
	hidden?: boolean;
	indent?: number;
	actionIcon?: string;
	isExtendedMode?: boolean;

	onAction?: (entry: DiffFlattenTreeAnyItem) => void;
	onSelect: (entry: DiffFlattenTreeAnyItem) => void;
	selectFile?: (entry: DiffFlattenTreeAnyItem, checked: boolean) => void;
	isFileSelected?: (entry: DiffFlattenTreeAnyItem) => boolean;
};

const DiffEntry = memo((props: DiffEntryProps) => {
	const {
		entry,
		onSelect,
		hidden,
		indent,
		selectFile,
		isFileSelected,
		onAction,
		actionIcon,
		renderCommentsCount,
		isExtendedMode,
	} = props;
	const { selectedByPath } = useContext(SelectedDiffEntryContext);

	const newIndent = Math.min(Math.max(indent || 0, 0), 10);
	const isCheckbox = selectFile && !!isFileSelected;

	const preventEvent = useCallback((e: React.MouseEvent<HTMLElement>) => {
		e.stopPropagation();
	}, []);

	const onFileSelect = useCallback((checked: boolean) => selectFile?.(entry, checked), [entry, selectFile]);

	const onActionClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			preventEvent(e);
			onAction?.(entry);
		},
		[entry, onAction, preventEvent],
	);

	const unscopedLogicPath = entry.type === "item" ? entry.pathname : null;
	const totalCommentsCount = useGetTotalCommentsByPathname(unscopedLogicPath);
	const commentsCount = renderCommentsCount ? totalCommentsCount : 0;

	if (hidden) return null;

	const discardAction = actionIcon ? (
		<DiffEntryAction
			icon={actionIcon}
			onClick={onActionClick}
			tooltip={t("git.discard.selected-file-arrow-tooltip")}
		/>
	) : null;

	const indentLine = (
		<IndentLine
			color="var(--color-merge-request-outline)"
			containerMarginLeft={`${(isCheckbox ? 0.15 : 0) + 1.18}rem`}
			gap="calc(1rem - 1px)"
			ignoreFirstLine={isCheckbox}
			level={newIndent}
		/>
	);

	const checkboxEl = (
		<div className="z-[1] absolute m-[0_1.2rem]">
			<DiffCheckbox checked={isFileSelected?.(entry)} onCheckedChange={onFileSelect} onClick={preventEvent} />
		</div>
	);

	if (entry.type === "resource") {
		return (
			<div className="relative w-full h-5 overflow-hidden" data-qa="qa-clickable">
				<DiffEntryHighlight
					active={selectedByPath === entry.filepath.new}
					onClick={() => onSelect(entry)}
					status={entry.overview.status}
				>
					{isCheckbox && newIndent <= 1 && checkboxEl}
					{indentLine}
					<DiffEntryIndent checkboxIndent={isCheckbox && newIndent === 0} indent={newIndent} type="resource">
						<div className="flex overflow-hidden w-full">
							<DiffEntryTitle>
								<Icon icon={entry.icon as IconCode} />
								<TextOverflowTooltip className="inline w-full pl-0">{entry.name}</TextOverflowTooltip>
							</DiffEntryTitle>
							{entry.overview.isLfs && isExtendedMode && <DiffEntryLfsIcon />}
						</div>
						<Overview {...entry.overview} />
						{newIndent === 1 && discardAction}
					</DiffEntryIndent>
				</DiffEntryHighlight>
			</div>
		);
	}

	if (entry.type === "node") {
		if (!entry.hasChilds) return;

		return (
			<div className="relative w-[95%] h-5 overflow-hidden">
				{indentLine}
				<Breadcrumbs breadcrumb={entry.breadcrumbs} marginLeft={newIndent + 1 + (isCheckbox ? 0.15 : 0)} />
			</div>
		);
	}

	return (
		<div className="relative w-full h-5 overflow-hidden" data-qa="qa-clickable">
			<DiffEntryHighlight
				active={selectedByPath === entry.filepath.new}
				onClick={() => onSelect(entry)}
				status={entry.overview.status}
			>
				{isCheckbox && checkboxEl}
				{indentLine}
				<DiffEntryIndent checkboxIndent={isCheckbox} indent={newIndent} type="item">
					<div className="flex overflow-hidden w-full [&>span]:flex">
						<DiffEntryTitleTooltip name={entry.name} />
						{entry.overview.isLfs && isExtendedMode && <DiffEntryLfsIcon />}
						<CommentCount className="ml-1" count={commentsCount} />
					</div>
					<Overview {...entry.overview} />
					{discardAction}
				</DiffEntryIndent>
			</DiffEntryHighlight>
		</div>
	);
});

export default DiffEntry;
