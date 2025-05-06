import DiffContent from "@components/Atoms/DiffContent";
import Icon from "@components/Atoms/Icon";
import IconWithText from "@components/Atoms/Icon/IconWithText";
import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout, { PopupMenuElement } from "@components/Layouts/PopupMenuLayout";
import styled from "@emotion/styled";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import t from "@ext/localization/locale/translate";
import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import type { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useState } from "react";

export type DiffViewMode = "wysiwyg" | "single-panel" | "double-panel";

const DiffViewModeElements: Record<DiffViewMode, JSX.Element> = {
	wysiwyg: <IconWithText iconCode="file-text" text={t("diff.wysiwyg")} />,
	"single-panel": <IconWithText iconCode="chevrons-left-right" text={t("diff.single-panel")} />,
	"double-panel": <IconWithText iconCode="columns-2" text={t("diff.double-panel")} />,
};

const DisableDiffViewModeElement = styled.div`
	opacity: 0.5;
	pointer-events: none;
`;

const RadioElementWrapper = styled.div`
	display: flex;
	gap: 0.25rem;
`;

const DiffViewModeElementsComponent = ({
	currentMode,
	onClick,
	hasWysiwyg,
}: {
	currentMode: DiffViewMode;
	onClick: (mode: DiffViewMode) => void;
	hasWysiwyg?: boolean;
}) => {
	return Object.entries(DiffViewModeElements).map(([mode, element]) => {
		const radioElement = (
			<RadioElementWrapper key={mode} onClick={() => onClick(mode as DiffViewMode)}>
				<input type="radio" checked={currentMode === mode} name="diff-view-mode" />
				{element}
			</RadioElementWrapper>
		);

		return !hasWysiwyg && mode === "wysiwyg" ? (
			<DisableDiffViewModeElement>{radioElement}</DisableDiffViewModeElement>
		) : (
			radioElement
		);
	});
};

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

const PopupmMenuElementBlock = styled.div`
	background: var(--color-article-bg);
	border-radius: var(--radius-large);
	outline: solid #515151;
	> div {
		color: var(--color-primary);
	}
	:hover {
		> div {
			color: var(--color-primary-general);
		}
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

const DiffContentComponent = ({ changes, unchangedColor }: { changes: DiffHunk[]; unchangedColor?: string }) => (
	<div data-theme="dark">
		<DiffContent
			whiteSpace="nowrap"
			changes={changes}
			unchangedColor={unchangedColor ? { color: unchangedColor } : undefined}
			showDiff
		/>
	</div>
);

const DiffBottomBar = ({
	title,
	oldRevision,
	newRevision,
	filePath,
	showDiffViewChanger = true,
	diffViewMode = "wysiwyg",
	type,
	onDiffViewPick,
	hasWysiwyg = true,
	className,
}: DiffBottomBarProps) => {
	const [chevronState, setChevronState] = useState<"up" | "down">("down");
	const currentElement = DiffViewModeElements[diffViewMode];
	const hasRevisions = !!oldRevision || !!newRevision;
	const changes = filePath?.hunks?.length ? filePath?.hunks : [{ value: filePath?.path, type }];
	const theme = ThemeService.value;

	const DiffContentElement = (
		<DiffContentWrapper showDiffViewChanger={showDiffViewChanger}>
			<Tooltip
				interactive
				content={
					<DiffContentComponent
						changes={changes}
						unchangedColor={`var(--color-primary${theme === Theme.dark ? "-inverse" : ""})`}
					/>
				}
			>
				<div>
					<DiffContentComponent changes={changes} unchangedColor="var(--color-primary)" />
				</div>
			</Tooltip>
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
					<PopupMenuLayout
						onOpen={() => setChevronState("up")}
						onClose={() => setChevronState("down")}
						trigger={
							showDiffViewChanger && (
								<PopupmMenuElementBlock>
									<PopupMenuElement
										IconElement={
											<div style={{ display: "flex", alignItems: "center" }}>
												{currentElement}
												<Icon code={`chevron-${chevronState}`} />
											</div>
										}
									/>
								</PopupmMenuElementBlock>
							)
						}
					>
						<DiffViewModeElementsComponent
							currentMode={diffViewMode}
							onClick={(mode) => onDiffViewPick?.(mode)}
							hasWysiwyg={hasWysiwyg}
						/>
					</PopupMenuLayout>
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
