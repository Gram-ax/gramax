import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import ProseMirrorDiffLineContent from "@ext/markdown/elements/diff/components/ProseMirrorDiffLineContent";
import { DiffLineType } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { ProseMirrorDiffLine } from "@ext/markdown/elements/diff/logic/model/ProseMirrorDiffLine";
import { useState } from "react";

interface DiffLineProps {
	top: number;
	height: number;
	left: number | string;
	diffLine: ProseMirrorDiffLine;
	oldScope: TreeReadScope;
	className?: string;
	onDiscard?: () => void;
}

const bgColors: Record<DiffLineType, string> = {
	added: "var(--color-status-new)",
	deleted: "var(--color-status-deleted)",
	modified: "var(--color-status-modified)",
};

const DiffLineContainer = ({
	children,
	type,
	style,
	onClick,
	className,
}: {
	children: React.ReactNode;
	type: DiffLineType;
	style?: React.CSSProperties;
	className?: string;
	onClick?: () => void;
}) => {
	const clickArea = "20px";

	return (
		<Tooltip content={t(`diff.type.${type}`)} offset={[-8, 8]}>
			<DiffLineContainerStyle
				style={{ ...(style ?? {}), width: clickArea }}
				diffLineType={type}
				onClick={onClick}
				className={className}
			>
				{children}
			</DiffLineContainerStyle>
		</Tooltip>
	);
};

const DiffLineContainerStyle = styled.div<{ diffLineType: DiffLineType }>`
	position: absolute;
	opacity: 0.5;

	${({ diffLineType }) => {
		if (diffLineType === "added") return "";
		return css`
			:hover {
				opacity: 1;
			}
		`;
	}}
`;

const DeletedTriangle = styled.div<{ height: number }>`
	width: 4px;
	height: inherit;

	border: ${({ height }) => height}px solid transparent;
	border-left: ${({ height }) => height}px solid ${bgColors.deleted};
`;

const AddedOrModifiedLine = styled.div<{ type: Exclude<DiffLineType, "deleted"> }>`
	width: 4px;
	height: inherit;

	border-radius: 3px;
	background-color: ${({ type }) => bgColors[type]};
`;

const DiffLine = ({ top, height, left, diffLine, oldScope, onDiscard, className }: DiffLineProps) => {
	const { type } = diffLine;
	const hasOldContent = (type === "modified" || type === "deleted") && diffLine.oldContent;
	const [visible, setVisible] = useState(false);

	const diffElement = type === "deleted" ? <DeletedTriangle height={height} /> : <AddedOrModifiedLine type={type} />;

	useWatch(() => {
		if (!hasOldContent) setVisible(false);
	}, [diffLine]);

	if (!hasOldContent)
		return (
			<div className={classNames(className, { "disable-hover": true })}>
				<DiffLineContainer type={type} style={{ top, height, left }}>
					{diffElement}
				</DiffLineContainer>
			</div>
		);

	return (
		<div className={className}>
			<DiffLineContainer
				type={type}
				style={{ top, height, left }}
				onClick={() => setVisible(true)}
				className="has-content"
			>
				<Tooltip
					visible={visible}
					content={
						<ProseMirrorDiffLineContent
							type={diffLine.type}
							oldContent={diffLine.oldContent}
							oldDecorations={diffLine.oldDecorations}
							oldScope={oldScope}
							onDiscard={(e) => {
								e.stopPropagation();
								onDiscard?.();
								setVisible(false);
							}}
						/>
					}
					arrow={false}
					place="top-end"
					interactive
					onClickOutside={() => setVisible(false)}
					contentClassName={classNames(
						"diff-line-tooltip-content",
						{ "has-content": !!diffLine.oldContent },
						[className],
					)}
				>
					{diffElement}
				</Tooltip>
			</DiffLineContainer>
		</div>
	);
};

export default styled(DiffLine)`
	&.disable-hover .diff-line {
		pointer-events: none;
	}

	.has-content {
		height: inherit;
		:hover {
			cursor: pointer;
		}
	}

	&.diff-line-tooltip-content {
		padding: 0 !important;
		font-size: 14px !important;
		line-height: 1.4 !important;
		background: transparent !important;
		color: var(--color-article-text) !important;
	}

	.tooltip-size {
		padding: 0.5rem 0.5rem 0 0.5rem;
		max-height: 50vh;
		overflow-y: auto;
		overflow-x: auto;
	}

	.tooltip-article {
		scrollbar-gutter: auto;
		width: 400px;
		padding: 0 !important;
		box-shadow: var(--menu-tooltip-shadow);
		border-radius: var(--radius-x-large);
		overflow: hidden;
	}
`;
