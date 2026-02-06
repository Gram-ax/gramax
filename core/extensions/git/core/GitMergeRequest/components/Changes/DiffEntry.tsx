import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import TooltipIfOveflow from "@core-ui/TooltipIfOveflow";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { DiffTreeAnyItem, DiffTreeBreadcrumb } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import Breadcrumbs from "@ext/git/core/GitMergeRequest/components/Changes/Breadcrumbs";
import { SelectedDiffEntryContext } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { getBreadcrumbs, getItemChilds } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntryUtils";
import IndentLine from "@ext/git/core/GitMergeRequest/components/Changes/IndentLine";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import { Accent } from "@ext/git/core/GitMergeRequest/components/Elements";
import getUnscopedLogicPath from "@ext/git/core/GitMergeRequest/logic/getUnscopedLogicPath";
import t from "@ext/localization/locale/translate";
import { default as CommentCountSrc } from "@ext/markdown/elements/comment/edit/components/CommentCount";
import { useGetTotalCommentsByPathname } from "@ext/markdown/elements/comment/edit/logic/CommentsCounterStore";
import type { DiffItem } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useCallback, useContext, useRef } from "react";
import { useDiffExtendedMode } from "./stores/DiffExtendedModeStore";

export type DiffEntryProps = {
	entry: DiffTreeAnyItem;
	onSelect: (entry: DiffTreeAnyItem) => void;
	renderCommentsCount: boolean;
	hidden?: boolean;
	indent?: number;

	onAction?: (entry: DiffTreeAnyItem) => void;
	actionIcon?: string;

	selectFile?: (entry: DiffTreeAnyItem, checked: boolean) => void;
	isFileSelected?: (entry: DiffTreeAnyItem) => boolean;
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
`;

const CommentCount = styled(CommentCountSrc)`
	margin-left: 0.25rem;
`;

const BreadcrumbWrapper = styled.div`
	position: relative;
	width: 95%;
`;

const Highlight = styled.div<{ isActive: boolean; status: FileStatus; indent?: number }>`
	display: flex;
	position: relative;
	align-items: center;
	width: 100%;
	margin: 0;
	padding: 0.15em 0;
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
			> :first-child {
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

	i {
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

	> i {
		padding-right: 0.2em;
		padding-top: 0.05em;
	}
`;

const TitleWrapper = styled.div`
	display: flex;
	overflow: hidden;
	width: 100%;

	> span {
		display: inline;
	}
`;

const CheckboxWrapper = styled.div`
	z-index: 1;
	position: absolute;
	margin: 0 1.2rem;
`;

const DiffEntry = ({
	entry,
	onSelect,
	hidden,
	indent,
	selectFile,
	isFileSelected,
	onAction,
	actionIcon,
	renderCommentsCount,
}: DiffEntryProps) => {
	const { selectedByPath } = useContext(SelectedDiffEntryContext);
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const extendedMode = useDiffExtendedMode();

	indent = Math.min(Math.max(indent || 0, 0), 10);

	const isCheckbox = selectFile && !!isFileSelected;

	const onFileSelect = useCallback(
		(checked: boolean, e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			e.preventDefault();
			selectFile?.(entry, checked);
		},
		[entry, selectFile],
	);

	const onActionClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			e.preventDefault();
			onAction?.(entry);
		},
		[entry, onAction],
	);

	const overflowElement = useRef<HTMLDivElement>(null);
	const unscopedLogicPath =
		entry.type === "item" ? getUnscopedLogicPath((entry.rawItem as DiffItem).logicPath, catalogName) : null;
	const totalCommentsCount = useGetTotalCommentsByPathname(unscopedLogicPath?.value);
	const commentsCount = renderCommentsCount ? totalCommentsCount : 0;

	if (hidden) return null;

	const discardFileComponent = actionIcon ? (
		<Icon
			className="action"
			code={actionIcon}
			onClick={onActionClick}
			tooltipContent={t("git.discard.selected-file-arrow-tooltip")}
		/>
	) : null;

	const indentLine = (
		<IndentLine
			color="var(--color-merge-request-outline)"
			containerMarginLeft={`${(isCheckbox ? 0.15 : 0) + 1.18}rem`}
			gap="calc(1rem - 1px)"
			ignoreFirstLine={isCheckbox}
			level={indent}
		/>
	);

	if (entry.type === "resource") {
		if (!extendedMode && indent > 1) return null;

		return (
			<Wrapper data-qa="qa-clickable">
				<Highlight
					isActive={selectedByPath === entry.filepath.new}
					onClick={() => onSelect(entry)}
					status={entry.status}
				>
					{isCheckbox && indent <= 1 && (
						<CheckboxWrapper>
							<Checkbox checked={isFileSelected(entry)} interactive onClick={onFileSelect} />
						</CheckboxWrapper>
					)}
					{indentLine}
					<Indent checkboxIndent={isCheckbox && indent === 0} indent={indent} isResource>
						<TooltipIfOveflow childrenRef={overflowElement} content={entry.name} interactive>
							<TitleWrapper>
								<Title indent={indent} ref={overflowElement}>
									<Icon code={entry.icon} />
									{entry.name}
								</Title>
								{entry.overview.isLfs && extendedMode && (
									<LfsIcon>
										<LfsIconText>LFS</LfsIconText>
									</LfsIcon>
								)}
							</TitleWrapper>
						</TooltipIfOveflow>
						<Overview {...entry.overview} />
						{indent === 1 && discardFileComponent}
					</Indent>
				</Highlight>
			</Wrapper>
		);
	}

	if (entry.type === "node") {
		if (!entry.childs.length) return;

		const itemChilds = getItemChilds(entry) ?? [];
		const allBreadcrumbs: DiffTreeBreadcrumb[] = [];
		getBreadcrumbs(entry, allBreadcrumbs);

		return (
			<>
				<BreadcrumbWrapper>
					{indentLine}
					<Breadcrumbs breadcrumb={allBreadcrumbs} marginLeft={indent + 1 + (isCheckbox ? 0.15 : 0)} />
				</BreadcrumbWrapper>
				{itemChilds.map((inner) => (
					<DiffEntry
						actionIcon={actionIcon}
						entry={inner}
						indent={indent + Number(allBreadcrumbs.length > 0)}
						isFileSelected={isFileSelected}
						key={inner.name}
						onAction={onAction}
						onSelect={onSelect}
						renderCommentsCount={renderCommentsCount}
						selectFile={selectFile}
					/>
				))}
			</>
		);
	}

	return (
		<>
			<Wrapper data-qa="qa-clickable">
				<Highlight
					isActive={selectedByPath === entry.filepath.new}
					onClick={() => onSelect(entry)}
					status={entry.status}
				>
					{isCheckbox && (
						<CheckboxWrapper>
							<Checkbox checked={isFileSelected(entry)} interactive onClick={onFileSelect} />
						</CheckboxWrapper>
					)}
					{indentLine}
					<Indent checkboxIndent={isCheckbox} indent={indent}>
						<TitleWrapper>
							<TooltipIfOveflow childrenRef={overflowElement} content={entry.name} interactive>
								<Title indent={indent} ref={overflowElement}>
									{entry.name}
								</Title>
							</TooltipIfOveflow>
							{entry.overview.isLfs && extendedMode && <LfsIcon>LFS</LfsIcon>}
							<CommentCount count={commentsCount} />
						</TitleWrapper>
						<Overview {...entry.overview} />
						{discardFileComponent}
					</Indent>
				</Highlight>
			</Wrapper>
			{entry.childs.length > 0 &&
				entry.childs.map((inner) => (
					<DiffEntry
						actionIcon={actionIcon}
						entry={inner}
						indent={indent + 1}
						isFileSelected={isFileSelected}
						key={inner.logicpath}
						onAction={onAction}
						onSelect={onSelect}
						renderCommentsCount={renderCommentsCount}
						selectFile={selectFile}
					/>
				))}
		</>
	);
};
export default DiffEntry;
