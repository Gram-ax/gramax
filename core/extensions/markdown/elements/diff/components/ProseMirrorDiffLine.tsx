import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ProseMirrorDiffLineContent from "@ext/markdown/elements/diff/components/ProseMirrorDiffLineContent";
import { ProseMirrorDiffLine } from "@ext/markdown/elements/diff/logic/model/ProseMirrorDiffLine";
import { useState } from "react";

interface DiffLineProps {
	top: number;
	height: number;
	left: number | string;
	diffLine: ProseMirrorDiffLine;
	oldScope: TreeReadScope;
	className?: string;
}

const bgColors: Record<ProseMirrorDiffLine["type"], string> = {
	added: "var(--color-status-new)",
	deleted: "var(--color-status-deleted)",
	modified: "var(--color-status-modified)",
};

const DiffLineConteiner = styled.div`
	width: var(--article-wrapper-padding-left);
	position: absolute;
	opacity: 0.5;

	:hover {
		opacity: 1;
	}
`;

const DiffLine = ({ top, height, left, diffLine, oldScope, className }: DiffLineProps) => {
	const { type } = diffLine;
	const hasOldContent = type === "modified" && diffLine.oldContent;
	const [visible, setVisible] = useState(false);

	useWatch(() => {
		if (!hasOldContent) setVisible(false);
	}, [diffLine]);

	if (!hasOldContent)
		return (
			<div className={classNames(className, { "disable-hover": true })}>
				<DiffLineConteiner style={{ top, height, left }}>
					<div className={"diff-line"} style={{ backgroundColor: bgColors[type] }} />
				</DiffLineConteiner>
			</div>
		);

	return (
		<div className={className}>
			<DiffLineConteiner style={{ top, height, left }}>
				<Tooltip
					visible={visible}
					content={
						<ProseMirrorDiffLineContent
							oldContent={diffLine.oldContent}
							oldDecorations={diffLine.oldDecorations}
							oldScope={oldScope}
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
					<div style={{ width: "20px" }} onClick={() => setVisible(true)} className="has-content">
						<div className={"diff-line"} style={{ backgroundColor: bgColors[type] }} />
					</div>
				</Tooltip>
			</DiffLineConteiner>
		</div>
	);
};

export default styled(DiffLine)`
	&.disable-hover {
		pointer-events: none;
	}

	.diff-line {
		width: 4px;
		border-radius: 3px;
		height: inherit;
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
		width: 400px;
		padding: 1rem;
		overflow-y: auto;
		overflow-x: auto;
	}

	.tooltip-article {
		padding: 0 !important;
		box-shadow: var(--menu-tooltip-shadow);
		border-radius: var(--radius-x-large);
		overflow: hidden;
	}
`;
