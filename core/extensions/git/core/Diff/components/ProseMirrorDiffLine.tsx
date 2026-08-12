import Icon from "@components/Atoms/Icon";
import TippyTooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import { cn } from "@core-ui/utils/cn";
import { css } from "@emotion/react";
// biome-ignore lint/style/noRestrictedImports: will be removed in the future
import styled from "@emotion/styled";
import { BreadcrumbDiffLine } from "@ext/git/core/Diff/components/BreadcrumbDiffLine";
import ProseMirrorDiffLineContent from "@ext/git/core/Diff/components/ProseMirrorDiffLineContent";
import { generateCommentTooltip } from "@ext/git/core/Diff/logic/commentsDiff/generateCommentTooltip";
import type { DiffLineType } from "@ext/git/core/Diff/logic/model/DiffLine";
import type { ProseMirrorDiffLine } from "@ext/git/core/Diff/logic/model/ProseMirrorDiffLine";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useState } from "react";

interface DiffLineProps {
	top: number;
	height: number;
	left: number | string;
	diffLine: ProseMirrorDiffLine;
	oldScope: TreeReadScope;
	articlePath: string;
	className?: string;
	onDiscard?: () => void;
}

const bgColors: Record<DiffLineType, string> = {
	added: "var(--color-status-new)",
	deleted: "var(--color-status-deleted)",
	modified: "var(--color-status-modified)",
	breadcrumb: "var(--color-status-rename)",
	comment: "var(--color-text-accent)",
};

const DiffLineContainer = ({
	children,
	tooltipText,
	type,
	style,
	tooltipOffset,
	onClick,
	className,
}: {
	children: React.ReactNode;
	type: DiffLineType;
	tooltipText: string;
	style?: React.CSSProperties;
	tooltipOffset?: [number, number];
	className?: string;
	onClick?: () => void;
}) => {
	const clickArea = "20px";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<DiffLineContainerStyle
					className={className}
					diffLineType={type}
					onClick={onClick}
					style={{ ...(style ?? {}), width: clickArea }}
				>
					{children}
				</DiffLineContainerStyle>
			</TooltipTrigger>
			<TooltipContent alignOffset={tooltipOffset?.[0] ?? 8} sideOffset={tooltipOffset?.[1] ?? 8}>
				{tooltipText}
			</TooltipContent>
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
	width: 3px;
	height: inherit;

	border-radius: 1px;
	background-color: ${({ type }) => bgColors[type]};
`;

const BreadcrumbLine = styled.div<{ type: Exclude<DiffLineType, "deleted"> }>`
	width: 3px;
	height: inherit;

	border-radius: 1px;
	background-color: ${({ type }) => bgColors[type]};
`;

const CommentIconWrapper = styled.div<{ height: number }>`
	display: flex;
	align-items: center;
	height: ${({ height }) => height}px;
`;

const DiffLine = ({ top, height, left, diffLine, oldScope, articlePath, onDiscard, className }: DiffLineProps) => {
	const { type } = diffLine;
	const isComment = type === "comment";
	const isBreadcrumb = type === "breadcrumb";
	const hasOldContent = (type === "modified" || type === "deleted") && diffLine.oldContent;
	const [visible, setVisible] = useState(false);
	const tooltipText = isComment ? generateCommentTooltip(diffLine.comments) : t(`diff.type.${type}`);

	let diffElement: JSX.Element;
	switch (type) {
		case "deleted":
			diffElement = <DeletedTriangle height={height} />;
			break;
		case "modified":
		case "added":
			diffElement = <AddedOrModifiedLine type={type} />;
			break;
		case "breadcrumb":
			diffElement = <BreadcrumbLine type={type} />;
			break;
		case "comment":
			diffElement = (
				<CommentIconWrapper height={height}>
					<Icon
						code="message-square"
						size="12px"
						svgStyle={{ color: "var(--color-text-accent)", fill: "var(--color-text-accent)" }}
					/>
				</CommentIconWrapper>
			);
			break;
	}

	useWatch(() => {
		if (!hasOldContent) setVisible(false);
	}, [diffLine]);

	if (isBreadcrumb) {
		return (
			<div className={className}>
				<DiffLineContainer
					className="has-content"
					onClick={() => setVisible(true)}
					style={{ top, height, left }}
					tooltipText={tooltipText}
					type={type}
				>
					<TippyTooltip
						arrow={false} // Because default tooltip has z-index 50
						content={<BreadcrumbDiffLine changes={diffLine.diff?.hunks} />}
						contentClassName={classNames(
							"diff-line-tooltip-content",
							{ "has-content": !!diffLine.oldContent },
							[className],
						)}
						interactive
						onClickOutside={(_, event) => {
							let el = event.target as HTMLElement;
							while (el) {
								const isCommentBlock = el.classList?.contains("comment-block");
								if (isCommentBlock) return;
								el = el.parentElement;
							}

							setVisible(false);
						}}
						place="top-end"
						visible={visible}
						zIndex={49}
					>
						{diffElement}
					</TippyTooltip>
				</DiffLineContainer>
			</div>
		);
	}

	if (!hasOldContent)
		return (
			<div className={classNames(className, { "disable-hover": true })}>
				<DiffLineContainer
					style={{ top, height, left }}
					tooltipOffset={isComment ? [-4, 8] : undefined}
					tooltipText={tooltipText}
					type={type}
				>
					{diffElement}
				</DiffLineContainer>
			</div>
		);

	return (
		<div className={className}>
			<DiffLineContainer
				className="has-content"
				onClick={() => setVisible(true)}
				style={{ top, height, left }}
				tooltipText={tooltipText}
				type={type}
			>
				<TippyTooltip
					arrow={false} // Because default tooltip has z-index 50
					content={
						<ProseMirrorDiffLineContent
							articlePath={articlePath}
							newContent={diffLine.newContent}
							oldContent={diffLine.oldContent}
							oldDecorations={diffLine.oldDecorations}
							oldScope={oldScope}
							onDiscard={(e) => {
								e.stopPropagation();
								onDiscard?.();
								setVisible(false);
							}}
							type={diffLine.type}
						/>
					}
					contentClassName={cn("diff-line-tooltip-content has-content", className)}
					interactive
					onClickOutside={(_, event) => {
						let el = event.target as HTMLElement;
						while (el) {
							const isCommentBlock = el.classList?.contains("comment-block");
							if (isCommentBlock) return;
							el = el.parentElement;
						}

						setVisible(false);
					}}
					place="top-end"
					visible={visible}
					zIndex={49}
				>
					{diffElement}
				</TippyTooltip>
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
