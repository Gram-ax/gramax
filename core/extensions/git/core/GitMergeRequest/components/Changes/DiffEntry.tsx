import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import Breadcrumbs from "@ext/git/core/GitMergeRequest/components/Changes/Breadcrumbs";
import { DiffCheckbox } from "@ext/git/core/GitMergeRequest/components/Changes/DiffCheckbox";
import { SelectedDiffEntryContext } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import IndentLine from "@ext/git/core/GitMergeRequest/components/Changes/IndentLine";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import { Accent } from "@ext/git/core/GitMergeRequest/components/Elements";
import getUnscopedLogicPath from "@ext/git/core/GitMergeRequest/logic/getUnscopedLogicPath";
import t from "@ext/localization/locale/translate";
import { default as CommentCountSrc } from "@ext/markdown/elements/comment/edit/components/CommentCount";
import { useGetTotalCommentsByPathname } from "@ext/markdown/elements/comment/edit/logic/CommentsCounterStore";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { IconButton } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { TextOverflowTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
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

const STATUS_COLORS = {
	[FileStatus.new]: "var(--color-status-new)",
	[FileStatus.delete]: "var(--color-status-deleted)",
	[FileStatus.modified]: "var(--color-status-modified)",
	[FileStatus.rename]: "var(--color-status-rename)",
};

const Wrapper = styled.div`
	position: relative;
	width: 100%;
	height: 1.25rem;
	overflow: hidden;
`;

const CommentCount = styled(CommentCountSrc)`
	margin-left: 0.25rem;
`;

const BreadcrumbWrapper = styled.div`
	position: relative;
	width: 95%;
	height: 1.25rem;
	overflow: hidden;
`;

const Highlight = styled.div<{ isActive: boolean; status: FileStatus; indent?: number }>`
	display: flex;
	position: relative;
	align-items: center;
	width: 100%;
	margin: 0;
	padding: 0.15em 0;
	height: 1.25rem;
	line-height: 1.33em;
	cursor: pointer;

	&::before {
		content: "";
		display: flex;
		position: absolute;
		align-items: center;
		left: 3px;
		top: 10%;
		width: 3px;
		height: 80%;
		background-color: ${({ status }) => STATUS_COLORS[status]};
	}

	.action {
		padding-left: 0;
		width: 0;
		opacity: 0;
		transition: all 0.07s ease-in-out;
		color: var(--color-nav-item);
		:hover {
			color: var(--color-nav-item-selected);
		}
	}

	:hover {
		background-color: var(--color-merge-request-hover);

		.action {
			padding-left: var(--distance-i-span);
			width: 1.5em;
			opacity: 1;
		}
	}

	${({ isActive }) =>
		isActive &&
		css`
			background-color: var(--color-merge-request-hover);
		`}
`;

const LfsIcon = styled.span`
	margin-left: 0.25rem;
	padding-right: 0.25rem;
	display: grid !important;
	place-items: center;
	color: var(--color-merge-request-text);
`;

const LfsIconText = styled.span`
	font-size: 0.5em;
	line-height: 1.2;
	padding: 0.1rem !important;
	border: 0.1px var(--color-merge-request-text) solid;
	border-radius: 2px;
`;

const Indent = styled(Accent)<{ indent?: number; checkboxIndent?: boolean; isResource?: boolean }>`
	margin-left: ${({ indent, checkboxIndent }) => (indent || 0) + 1.05 + (checkboxIndent ? 0.15 : 0)}rem;
	margin-right: 1.65em;
	display: flex;
	align-items: center;
	width: 100%;
	${({ isResource }) =>
		isResource &&
		css`
			color: var(--color-merge-request-text);
			> :first-of-type {
				opacity: 0.8;
			}
		`}

	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	> span {
		padding-left: 0.2em;
		max-width: 100%;
	}

	svg {
		padding-top: 0.05em;
		margin-bottom: 0.15em;
	}
`;

const Title = styled.span<{ indent?: number }>`
	display: flex;
	align-items: center;
	justify-content: flex-start;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 100%;

	> svg {
		margin-right: 0.2em;
	}
`;

const TitleWrapper = styled.div`
	display: flex;
	overflow: hidden;
	width: 100%;

	> span {
		display: flex;
	}
`;

const CheckboxWrapper = styled.div`
	z-index: 1;
	position: absolute;
	margin: 0 1.2rem;
`;

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
	const catalogName = useCatalogPropsStore((state) => state.data?.name);

	const newIndent = Math.min(Math.max(indent || 0, 0), 10);

	const isCheckbox = selectFile && !!isFileSelected;

	const preventEvent = useCallback((e: React.MouseEvent<HTMLElement>) => {
		e.stopPropagation();
	}, []);

	const onFileSelect = useCallback(
		(checked: boolean) => {
			selectFile?.(entry, checked);
		},
		[entry, selectFile],
	);

	const onActionClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			preventEvent(e);
			onAction?.(entry);
		},
		[entry, onAction, preventEvent],
	);

	const unscopedLogicPath = entry.type === "item" ? getUnscopedLogicPath(entry.logicpath, catalogName) : null;
	const totalCommentsCount = useGetTotalCommentsByPathname(unscopedLogicPath?.value);
	const commentsCount = renderCommentsCount ? totalCommentsCount : 0;

	if (hidden) return null;

	const discardFileComponent = actionIcon ? (
		<Tooltip>
			<TooltipContent>{t("git.discard.selected-file-arrow-tooltip")}</TooltipContent>
			<TooltipTrigger asChild>
				<IconButton
					className="action p-0 h-3.5 w-3.5"
					icon={actionIcon}
					onClick={onActionClick}
					size="xs"
					variant="text"
				/>
			</TooltipTrigger>
		</Tooltip>
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

	if (entry.type === "resource") {
		return (
			<Wrapper data-qa="qa-clickable">
				<Highlight
					isActive={selectedByPath === entry.filepath.new}
					onClick={() => onSelect(entry)}
					status={entry.overview.status}
				>
					{isCheckbox && newIndent <= 1 && (
						<CheckboxWrapper>
							<DiffCheckbox
								checked={isFileSelected(entry)}
								onCheckedChange={onFileSelect}
								onClick={preventEvent}
							/>
						</CheckboxWrapper>
					)}
					{indentLine}
					<Indent checkboxIndent={isCheckbox && newIndent === 0} indent={newIndent} isResource>
						<TitleWrapper>
							<Title indent={newIndent}>
								<Icon icon={entry.icon} />
								<TextOverflowTooltip className="inline w-full pl-0">{entry.name}</TextOverflowTooltip>
							</Title>
							{entry.overview.isLfs && isExtendedMode && (
								<LfsIcon>
									<LfsIconText>LFS</LfsIconText>
								</LfsIcon>
							)}
						</TitleWrapper>
						<Overview {...entry.overview} />
						{newIndent === 1 && discardFileComponent}
					</Indent>
				</Highlight>
			</Wrapper>
		);
	}

	if (entry.type === "node") {
		if (!entry.hasChilds) return;

		return (
			<BreadcrumbWrapper>
				{indentLine}
				<Breadcrumbs breadcrumb={entry.breadcrumbs} marginLeft={newIndent + 1 + (isCheckbox ? 0.15 : 0)} />
			</BreadcrumbWrapper>
		);
	}

	return (
		<Wrapper data-qa="qa-clickable">
			<Highlight
				isActive={selectedByPath === entry.filepath.new}
				onClick={() => onSelect(entry)}
				status={entry.overview.status}
			>
				{isCheckbox && (
					<CheckboxWrapper>
						<DiffCheckbox
							checked={isFileSelected(entry)}
							onCheckedChange={onFileSelect}
							onClick={preventEvent}
						/>
					</CheckboxWrapper>
				)}
				{indentLine}
				<Indent checkboxIndent={isCheckbox} indent={newIndent}>
					<TitleWrapper>
						<Title indent={newIndent}>
							<TextOverflowTooltip className="inline w-full pl-0">{entry.name}</TextOverflowTooltip>
						</Title>
						{entry.overview.isLfs && isExtendedMode && <LfsIcon>LFS</LfsIcon>}
						<CommentCount count={commentsCount} />
					</TitleWrapper>
					<Overview {...entry.overview} />
					{discardFileComponent}
				</Indent>
			</Highlight>
		</Wrapper>
	);
});

export default DiffEntry;
