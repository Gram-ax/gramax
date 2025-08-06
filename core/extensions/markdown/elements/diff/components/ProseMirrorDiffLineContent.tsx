import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import Icon from "@components/Atoms/Icon";
import Tooltip, { DEFAULT_TOOLTIP_SHOW_DELAY } from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import getExtensions from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import addDecorations from "@ext/markdown/elements/diff/logic/addDecorations";
import DiffExtension from "@ext/markdown/elements/diff/logic/DiffExtension";
import { DiffLineType } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import Document from "@tiptap/extension-document";
import { PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";

const diffDeletedTextPluginKey = new PluginKey("diff-deleted-text");

interface ProsemirrorDiffLineContentProps {
	oldContent: JSONContent;
	oldDecorations: Decoration[];
	oldScope: TreeReadScope;
	type: Exclude<DiffLineType, "added">;
	onDiscard?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const DiscardWrapper = styled.div`
	display: flex;
	align-items: center;
	cursor: pointer;

	color: var(--color-nav-item);
	:hover {
		color: var(--color-nav-item-selected);
	}
`;

const Footer = styled.div`
	display: flex;
	gap: 0.5em;
	font-size: 0.7rem;
	opacity: 0.5;
	margin: 0 0.5rem;
`;

const ProsemirrorDiffLineContent = (props: ProsemirrorDiffLineContentProps) => {
	// We might need oldScope in future
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { oldContent, oldDecorations, onDiscard, oldScope, type } = props;

	const extensions = useMemo(() => [...getExtensions(), Comment], []);

	const editor = useEditor(
		{
			extensions: [
				...extensions,
				DiffExtension.configure({ isOldEditor: true }),
				Document.configure({ content: `paragraph ${ElementGroups.block}+` }),
			],
			content: oldContent,
			editable: false,
		},
		[oldContent],
	);

	useEffect(() => {
		if (!editor || editor.isDestroyed) return;
		addDecorations(editor, DecorationSet.create(editor.state.doc, oldDecorations), diffDeletedTextPluginKey);
	}, [editor, oldDecorations]);

	const [tooltipVisible, setTooltipVisible] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout>(null);

	const setTooltipVisibleWrapper = (visible: boolean) => {
		if (visible) {
			timeoutRef.current = setTimeout(() => {
				setTooltipVisible(true);
			}, DEFAULT_TOOLTIP_SHOW_DELAY);
		} else {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			setTooltipVisible(false);
		}
	};

	const DiscardButton = (
		<Tooltip content={t("git.discard.paragraph-tooltip")} distance={0} visible={tooltipVisible}>
			<DiscardWrapper
				onMouseEnter={() => setTooltipVisibleWrapper(true)}
				onMouseLeave={() => setTooltipVisibleWrapper(false)}
				onClick={(e) => {
					setTooltipVisibleWrapper(false);
					onDiscard?.(e);
				}}
			>
				<Icon code="reply" />
			</DiscardWrapper>
		</Tooltip>
	);

	return (
		<div className={classNames("article", {}, ["tooltip-article"])}>
			<div className="tooltip-size">
				<MinimizedArticleStyled>
					<div className={classNames("article-body", {}, ["popup-article"])}>
						<EditorContent editor={editor} data-iseditable={false} />
					</div>
				</MinimizedArticleStyled>
			</div>
			<Footer>
				<span>{t(`diff.type.${type}`)}</span>
				{type === "modified" && DiscardButton}
			</Footer>
		</div>
	);
};

export default ProsemirrorDiffLineContent;
