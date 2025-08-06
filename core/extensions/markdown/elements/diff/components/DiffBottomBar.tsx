import DiffContent from "@components/Atoms/DiffContent";
import Icon from "@components/Atoms/Icon";
import TooltipIfOveflow from "@core-ui/TooltipIfOveflow";
import styled from "@emotion/styled";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import DiffViewPicker from "@ext/markdown/elements/diff/components/DiffViewPicker";
import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import type { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { forwardRef, useRef } from "react";

export type DiffViewMode = "wysiwyg-single" | "wysiwyg-double" | "single-panel" | "double-panel";

const LargeIcon = styled(Icon)`
	font-size: 16px;
	margin: 0;
	padding: 0;
`;

const FromWhereContainer = styled.div`
	display: flex;
	gap: 0.25rem;
	overflow: hidden;
	flex-grow: 1;
	align-items: center;
`;

const BranchContainer = styled.div`
	height: 1rem;
	line-height: 0;
	border-radius: var(--radius-x-small);
	max-width: 45%;
	color: var(--merge-branch-code-text);

	> span {
		display: inline-block;
		height: 1rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
`;

const DiffContentWrapper = styled.div<{ showDiffViewChanger: boolean }>`
	overflow: hidden;
	${(p) => (p.showDiffViewChanger ? "padding-right: 1rem;" : "")}
	color: var(--color-primary);
	width: 100%;
	pre {
		padding: 0;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	> div,
	> div > div {
		width: fit-content;
		max-width: 100%;
	}

	> div > div > div {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
`;

interface DiffBottomBarProps {
	title?: string;
	oldRevision?: string;
	newRevision?: string;
	filePath: DiffFilePaths;
	showDiffViewChanger?: boolean;
	diffViewMode?: DiffViewMode;
	type?: FileStatus;
	onDiffViewPick?: (mode: DiffViewMode) => void;
	hasWysiwyg?: boolean;
	className?: string;
}

const DiffContentComponent = forwardRef<HTMLDivElement, { changes: DiffHunk[]; unchangedColor?: string }>(
	({ changes, unchangedColor }: { changes: DiffHunk[]; unchangedColor?: string }, ref) => (
		<div data-theme="dark">
			<DiffContent
				ref={ref}
				whiteSpace="nowrap"
				changes={changes}
				unchangedColor={unchangedColor ? { color: unchangedColor } : undefined}
				showDiff
			/>
		</div>
	),
);

const DiffBottomBar = ({
	title,
	oldRevision,
	newRevision,
	filePath,
	showDiffViewChanger = true,
	diffViewMode = "wysiwyg-single",
	type,
	onDiffViewPick,
	hasWysiwyg = true,
	className,
}: DiffBottomBarProps) => {
	const hasRevisions = !!oldRevision || !!newRevision;
	const changes = filePath?.hunks?.length ? filePath?.hunks : [{ value: filePath?.path, type }];
	const theme = ThemeService.value;
	const wrapperRef = useRef<HTMLDivElement>(null);

	const DiffContentElement = (
		<DiffContentWrapper showDiffViewChanger={showDiffViewChanger}>
			<TooltipIfOveflow
				childrenRef={wrapperRef}
				interactive
				content={
					<DiffContentComponent
						changes={changes}
						unchangedColor={`var(--color-primary${theme === Theme.dark ? "-inverse" : ""})`}
					/>
				}
			>
				<div>
					<DiffContentComponent changes={changes} unchangedColor="var(--color-primary)" ref={wrapperRef} />
				</div>
			</TooltipIfOveflow>
		</DiffContentWrapper>
	);

	const bottomBarContent = (
		<FromWhereContainer>
			<BranchContainer title={oldRevision}>
				<FormattedBranch name={oldRevision} />
			</BranchContainer>
			<LargeIcon strokeWidth={1.5} code="arrow-right" style={{ color: "var(--color-primary)" }} />
			<BranchContainer title={newRevision}>
				<FormattedBranch name={newRevision} />
			</BranchContainer>
		</FromWhereContainer>
	);

	return (
		<div className={className} data-theme="dark" id="diff-bottom-bar">
			<div className="bottom-bar-content">
				{title && <div style={{ color: "var(--color-primary)" }}>{title}</div>}
				{hasRevisions && DiffContentElement}
				<div className="bottom-bar-row" style={{ justifyContent: "flex-end" }}>
					{hasRevisions ? bottomBarContent : DiffContentElement}
					{showDiffViewChanger && (
						<DiffViewPicker
							currentMode={diffViewMode}
							onDiffViewPick={(mode) => onDiffViewPick?.(mode)}
							hasWysiwyg={hasWysiwyg}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default styled(DiffBottomBar)`
	& {
		width: 100%;
		height: 100%;
		background-color: var(--diff-bottom-bar);
		padding: 8px 9px 6px 17px;

		border-top-left-radius: var(--radius-xx-large);
		border-top-right-radius: var(--radius-xx-large);
	}

	.bottom-bar-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.bottom-bar-row {
		display: flex;
		align-items: center;
	}
`;
