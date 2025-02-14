import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import Breadcrumbs from "@ext/git/core/GitMergeRequest/components/Changes/Breadcrumbs";
import { SelectedDiffEntryContext } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import { Accent } from "@ext/git/core/GitMergeRequest/components/Elements";
import t from "@ext/localization/locale/translate";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

import { useCallback, useContext } from "react";

export type DiffEntryProps = {
	entry: DiffTreeAnyItem;
	onSelect: (entry: DiffTreeAnyItem) => void;
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
	width: 100%;
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
		padding-left: 0.2em;
		flex-grow: 1;
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
	flex-grow: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;

	> i {
		padding-right: 0.2em;
		padding-top: 0.05em;
	}
`;

const CheckboxWrapper = styled.div`
	position: absolute;
	margin: 0 1.05rem;
`;

const Outline = styled.div<{ isCheckbox?: boolean; indent?: number }>`
	position: relative;

	${({ indent, isCheckbox }) =>
		indent &&
		css`
			&::before {
				content: "";
				z-index: 99;
				display: flex;
				position: absolute;
				align-items: center;
				left: ${indent + 0.22 + (isCheckbox ? 1.23 + Number(indent <= 1) : 0)}rem;
				width: 1px;
				height: 100%;
				background-color: var(--color-merge-request-outline);
			}
		`}
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
}: DiffEntryProps) => {
	const { selectedByPath } = useContext(SelectedDiffEntryContext);

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

	if (entry.type === "node" && entry.childs.length === 1 && entry.childs[0].type === "node") {
		const breadcrumb = entry.breadcrumbs;
		entry = { ...entry.childs[0], breadcrumbs: [...breadcrumb, ...entry.childs[0].breadcrumbs] };
	}

	const discardFileComponent = actionIcon ? (
		<Icon
			onClick={onActionClick}
			className="action"
			code={actionIcon}
			tooltipContent={t("git.discard.selected-file-arrow-tooltip")}
		/>
	) : null;

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

					<Indent indent={indent} checkboxIndent={isCheckbox && indent === 0} isResource>
						<Title indent={indent}>
							<Icon code={entry.icon} />
							{entry.name}
						</Title>

						<Overview added={entry.overview.added} deleted={entry.overview.removed} />
					</Indent>
				</Highlight>
			</Wrapper>
		);
	}

	if (entry.type === "node") {
		if (!entry.childs.length) return;
		return (
			<>
				<Wrapper>
					<Breadcrumbs marginLeft={indent + 1 + (isCheckbox ? 0.15 : 0)} breadcrumb={entry.breadcrumbs} />
				</Wrapper>

				<Outline indent={entry.breadcrumbs?.length > 0 ? (indent || 1) + 1 : 0} isCheckbox={isCheckbox}>
					{entry.childs.map((inner, id) => (
						<DiffEntry
							key={id}
							entry={inner}
							onSelect={onSelect}
							indent={indent + Number(entry.breadcrumbs?.length > 0)}
							selectFile={selectFile}
							isFileSelected={isFileSelected}
							onAction={onAction}
							actionIcon={actionIcon}
						/>
					))}
				</Outline>
			</>
		);
	}

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
					<Indent indent={indent} checkboxIndent={isCheckbox}>
						<Title indent={indent}>{entry.name}</Title>
						<Overview added={entry.overview.added} deleted={entry.overview.removed} />
						{discardFileComponent}
					</Indent>
				</Highlight>
			</Wrapper>

			{entry.childs.length > 0 && (
				<Outline indent={indent + Number(!isCheckbox)} isCheckbox={isCheckbox}>
					{entry.childs.map((inner, id) => (
						<DiffEntry
							key={id}
							entry={inner}
							onSelect={onSelect}
							indent={indent + 1}
							selectFile={selectFile}
							isFileSelected={isFileSelected}
							onAction={onAction}
							actionIcon={actionIcon}
						/>
					))}
				</Outline>
			)}
		</>
	);
};
export default DiffEntry;
