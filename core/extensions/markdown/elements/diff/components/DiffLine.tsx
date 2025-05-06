import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import getExtensions from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import addDecorations from "@ext/markdown/elements/diff/logic/addDecorations";
import DiffExtension, {
	DiffLine as DiffLineType,
	NodeBeforeData,
} from "@ext/markdown/elements/diff/logic/DiffExtension";
import Document from "@tiptap/extension-document";
import { PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";

interface DiffLineProps {
	top: number;
	height: number;
	left: number | string;
	type: DiffLineType["type"];
	oldScope: TreeReadScope;
	nodeBefore?: NodeBeforeData;
	className?: string;
}

const bgColors: Record<DiffLineType["type"], string> = {
	added: "var(--color-status-new)",
	deleted: "var(--color-status-deleted)",
	modified: "var(--color-status-modified)",
};

const DiffLineConteiner = styled.div`
	width: 100px;
	position: absolute;
	opacity: 0.5;

	:hover {
		opacity: 1;
	}
`;

const DiffLine = ({ top, height, left, type, nodeBefore, oldScope, className }: DiffLineProps) => {
	const [visible, setVisible] = useState(false);

	useWatch(() => {
		if (!nodeBefore?.content) setVisible(false);
	}, [nodeBefore]);

	if (type !== "modified" || !nodeBefore?.content)
		return (
			<div className={className}>
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
					content={<TooltipContent nodeBefore={nodeBefore} oldScope={oldScope} />}
					arrow={false}
					place="top-end"
					interactive
					onClickOutside={() => setVisible(false)}
					contentClassName={classNames(
						"diff-line-tooltip-content",
						{ "has-content": !!nodeBefore?.content },
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

const diffDeletedTextPluginKey = new PluginKey("diff-deleted-text");

interface TooltipContentProps {
	nodeBefore: NodeBeforeData;
	oldScope: TreeReadScope;
}

const TooltipContent = ({ nodeBefore, oldScope }: TooltipContentProps) => {
	const contentBefore = nodeBefore.content;
	const editor = useEditor(
		{
			extensions: [
				...getExtensions(),
				DiffExtension.configure({ isOldEditor: true }),
				Document.configure({ content: `paragraph ${ElementGroups.block}+` }),
			],
			content: contentBefore,
			editable: false,
		},
		[contentBefore],
	);

	useEffect(() => {
		if (!editor) return;
		const decorations = Decoration.inline(nodeBefore.relativeFrom, nodeBefore.relativeTo, {
			class: "deleted-text",
		});
		addDecorations(editor, DecorationSet.create(editor.state.doc, [decorations]), diffDeletedTextPluginKey);
	}, [editor, nodeBefore.relativeTo, nodeBefore.relativeFrom]);

	return (
		<ResourceService.Provider scope={oldScope}>
			<div className="tooltip-article">
				<div className={classNames("article", {}, ["tooltip-size"])}>
					<MinimizedArticleStyled>
						<div className={classNames("article-body", {}, ["popup-article"])}>
							<EditorContent editor={editor} data-iseditable={false} />
						</div>
					</MinimizedArticleStyled>
				</div>
			</div>
		</ResourceService.Provider>
	);
};
