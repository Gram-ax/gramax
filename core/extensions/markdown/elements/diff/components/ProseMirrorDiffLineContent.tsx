import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import Icon from "@components/Atoms/Icon";
import Tooltip, { DEFAULT_TOOLTIP_SHOW_DELAY } from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import ArticleContextWrapper from "@core-ui/ScopedContextWrapper/ArticleContextWrapper";
import getIsSafari from "@core-ui/utils/isSafari";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import getExtensions from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import CommentEditorProvider from "@ext/markdown/elements/comment/edit/logic/CommentEditorProvider";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import DiffExtension from "@ext/markdown/elements/diff/logic/DiffExtension";
import type { DiffLineType } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import Document from "@tiptap/extension-document";
import { type Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";

interface ProsemirrorDiffLineContentProps {
	oldContent: JSONContent;
	oldDecorations: Decoration[];
	oldScope: TreeReadScope;
	type: Exclude<DiffLineType, "added" | "comment">;
	articlePath: string;
	onDiscard?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const DiscardWrapper = styled.div<{ isSafari: boolean }>`
	display: flex;
	align-items: center;
	cursor: pointer;

	${({ isSafari }) =>
		isSafari &&
		css`
			> i {
				margin-bottom: 3px;
			}
		`}

	opacity: 0.6;
	:hover {
		opacity: 1;
	}
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 0.5em;
	font-size: 0.7rem;
	margin: 0.75em 0.5rem 0 0.5rem;

	font-weight: 400;
`;

const HeaderText = styled.span`
	opacity: 0.6;
`;

const isSafari = getIsSafari();

const ProsemirrorDiffLineContent = (props: ProsemirrorDiffLineContentProps) => {
	const { oldContent, oldDecorations, onDiscard, oldScope, type, articlePath } = props;

	const extensions = useMemo(() => [...getExtensions(), Comment.configure({ appendCommentToBody: true })], []);

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
		editor.commands.setMeta("updateDiffDecorators", DecorationSet.create(editor.state.doc, oldDecorations));
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
		<Tooltip content={t("git.discard.paragraph-tooltip")} distance={5} visible={tooltipVisible}>
			<DiscardWrapper
				isSafari={isSafari}
				onClick={(e) => {
					setTooltipVisibleWrapper(false);
					onDiscard?.(e);
				}}
				onMouseEnter={() => setTooltipVisibleWrapper(true)}
				onMouseLeave={() => setTooltipVisibleWrapper(false)}
			>
				<Icon code="reply" />
				<span>{t("diff.discard")}</span>
			</DiscardWrapper>
		</Tooltip>
	);

	return (
		<ArticleContextWrapper articlePath={articlePath} scope={oldScope}>
			<div className={classNames("article", {}, ["tooltip-article"])}>
				<Header>
					<HeaderText>
						{type === "modified"
							? t("diff.previous-version").toUpperCase()
							: t(`diff.type.${type}`).toUpperCase()}
					</HeaderText>
					{type === "modified" && DiscardButton}
				</Header>
				<div className="tooltip-size">
					<MinimizedArticleStyled>
						<div className={classNames("article-body", {}, ["popup-article"])}>
							<CommentEditorProvider editor={editor}>
								<EditorContent data-iseditable={false} editor={editor} />
							</CommentEditorProvider>
						</div>
					</MinimizedArticleStyled>
				</div>
			</div>
		</ArticleContextWrapper>
	);
};

export default ProsemirrorDiffLineContent;
