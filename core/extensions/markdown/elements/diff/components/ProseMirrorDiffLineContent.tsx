import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import { classNames } from "@components/libs/classNames";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import getExtensions from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import ScopeWrapper from "@ext/markdown/elements/diff/components/ScopeWrapper";
import addDecorations from "@ext/markdown/elements/diff/logic/addDecorations";
import DiffExtension from "@ext/markdown/elements/diff/logic/DiffExtension";
import Document from "@tiptap/extension-document";
import { PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo } from "react";

const diffDeletedTextPluginKey = new PluginKey("diff-deleted-text");

interface ProsemirrorDiffLineContentProps {
	oldContent: JSONContent;
	oldDecorations: Decoration[];
	oldScope: TreeReadScope;
}

const ProsemirrorDiffLineContent = ({ oldContent, oldDecorations, oldScope }: ProsemirrorDiffLineContentProps) => {
	const extensions = useMemo(() => getExtensions(), []);

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

	return (
		<ScopeWrapper scope={oldScope}>
			<div className="tooltip-article">
				<div className={classNames("article", {}, ["tooltip-size"])}>
					<MinimizedArticleStyled>
						<div className={classNames("article-body", {}, ["popup-article"])}>
							<EditorContent editor={editor} data-iseditable={false} />
						</div>
					</MinimizedArticleStyled>
				</div>
			</div>
		</ScopeWrapper>
	);
};

export default ProsemirrorDiffLineContent;
