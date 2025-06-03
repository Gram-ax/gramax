import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import CommentCountSrc from "@components/Comments/CommentCount";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
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
import { DiffItem } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

import { useCallback, useContext } from "react";

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
		display: inline;
		padding-left: 0.2em;
		max-width: 100%;
	}

	i {
		padding-top: 0.05em;
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
	const comments = CommentCounterService.value;
	const catalogName = CatalogPropsService.value?.name;

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
	if (hidden) return null;

	const discardFileComponent = actionIcon ? (
		<Icon
			onClick={onActionClick}
			className="action"
			code={actionIcon}
			tooltipContent={t("git.discard.selected-file-arrow-tooltip")}
		/>
	) : null;

	const indentLine = (
		<IndentLine
			gap="calc(1rem - 1px)"
			color="var(--color-merge-request-outline)"
			level={indent}
			containerMarginLeft={`${(isCheckbox ? 0.15 : 0) + 1.18}rem`}
			ignoreFirstLine={isCheckbox}
		/>
	);

	if (entry.type === "resource") {
		return (
			<Wrapper>
				<Highlight
					status={entry.status}
					onClick={() => onSelect(entry)}
					isActive={selectedByPath === entry.filepath.new}
				>
					{isCheckbox && indent <= 1 && (
						<CheckboxWrapper>
							<Checkbox interactive checked={isFileSelected(entry)} onClick={onFileSelect} />
						</CheckboxWrapper>
					)}
					{indentLine}
					<Indent indent={indent} checkboxIndent={isCheckbox && indent === 0} isResource>
						<TitleWrapper>
							<Title indent={indent}>
								<Icon code={entry.icon} />
								{entry.name}
							</Title>
						</TitleWrapper>
						<Overview added={entry.overview.added} deleted={entry.overview.removed} />
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
					<Breadcrumbs marginLeft={indent + 1 + (isCheckbox ? 0.15 : 0)} breadcrumb={allBreadcrumbs} />
				</BreadcrumbWrapper>
				{itemChilds.map((inner, id) => (
					<DiffEntry
						key={id}
						entry={inner}
						onSelect={onSelect}
						indent={indent + Number(allBreadcrumbs.length > 0)}
						selectFile={selectFile}
						isFileSelected={isFileSelected}
						onAction={onAction}
						actionIcon={actionIcon}
						renderCommentsCount={renderCommentsCount}
					/>
				))}
			</>
		);
	}

	const unscopedLogicPath = getUnscopedLogicPath((entry.rawItem as DiffItem).logicPath, catalogName);
	const commentsCount = renderCommentsCount
		? CommentCounterService.getTotalByPathname(comments, unscopedLogicPath.value)
		: 0;

	return (
		<>
			<Wrapper>
				<Highlight
					status={entry.status}
					onClick={() => onSelect(entry)}
					isActive={selectedByPath === entry.filepath.new}
				>
					{isCheckbox && (
						<CheckboxWrapper>
							<Checkbox interactive checked={isFileSelected(entry)} onClick={onFileSelect} />
						</CheckboxWrapper>
					)}
					{indentLine}
					<Indent indent={indent} checkboxIndent={isCheckbox}>
						<TitleWrapper>
							<Title indent={indent}>{entry.name}</Title>
							<CommentCount count={commentsCount} />
						</TitleWrapper>
						<Overview added={entry.overview.added} deleted={entry.overview.removed} />
						{discardFileComponent}
					</Indent>
				</Highlight>
			</Wrapper>
			{entry.childs.length > 0 &&
				entry.childs.map((inner, id) => (
					<DiffEntry
						key={id}
						entry={inner}
						onSelect={onSelect}
						indent={indent + 1}
						selectFile={selectFile}
						isFileSelected={isFileSelected}
						onAction={onAction}
						actionIcon={actionIcon}
						renderCommentsCount={renderCommentsCount}
					/>
				))}
		</>
	);
};
export default DiffEntry;
