import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { CommentEditorEventsContext } from "@ext/markdown/elements/comment/edit/logic/CommentEditorProvider";
import AstDiffDataHandler from "@ext/markdown/elements/diff/logic/AstDiffDataHandler";
import ProsemirrorAstDiffTransformer from "@ext/markdown/elements/diff/logic/astTransformer/ProseMirrorAstDiffTransformer";
import getParagraphCommentsDiffLines from "@ext/markdown/elements/diff/logic/commentsDiff/getParagraphCommentsDiffLines";
import useCommentsDiff from "@ext/markdown/elements/diff/logic/commentsDiff/useCommentsDiff";
import DiffRenderDataHandler from "@ext/markdown/elements/diff/logic/DiffRenderDataHandler";
import { Transaction } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
import { Editor } from "@tiptap/react";
import { useContext, useEffect, useRef } from "react";

const DEBOUNCDE_DELAY = 250;

interface UseDiffProps {
	newEditor: Editor;
	oldEditor: Editor;
	newApiUrlCreator: ApiUrlCreator;
	oldApiUrlCreator: ApiUrlCreator;
}

const useDiff = (props: UseDiffProps) => {
	const { newEditor, oldEditor, newApiUrlCreator, oldApiUrlCreator } = props;
	const newEditorDecorations = useRef<DecorationSet>(null);

	const commentEditorEvents = useContext(CommentEditorEventsContext);
	const getCommentsDiff = useCommentsDiff(newApiUrlCreator, oldApiUrlCreator);

	const updateDiffDecorators = async () => {
		const astDiffTransformer = new ProsemirrorAstDiffTransformer(oldEditor.state.doc, newEditor.state.doc);
		const astDiffDataHandler = new AstDiffDataHandler(astDiffTransformer);

		astDiffDataHandler.calculateData();

		const diffRenderDataHandler = new DiffRenderDataHandler(astDiffDataHandler);

		const { addedDecorations, removedDecorations, changedContextDecorations, diffLines } =
			diffRenderDataHandler.getDiffRenderData();

		const { oldParagraphComments, newParagraphComments } = astDiffTransformer.getParagraphComments();
		const paragraphCommentsDiff = await getCommentsDiff(oldParagraphComments, newParagraphComments);
		const commentsDiffLines = getParagraphCommentsDiffLines(astDiffDataHandler, paragraphCommentsDiff);

		const extraRemovedDecorations = diffRenderDataHandler.makeRemovedDiffLinesToDecorators(diffLines);

		const oldEditorDecorations = DecorationSet.create(oldEditor.state.doc, [
			...removedDecorations,
			...extraRemovedDecorations,
		]);
		const newEditorDecoration = DecorationSet.create(newEditor.state.doc, [
			...addedDecorations,
			...changedContextDecorations,
		]);

		const proseMirrorDiffLines = astDiffTransformer.convertToProseMirrorDiffLines(diffLines);

		newEditor.commands.updateDiffLinesModel([...proseMirrorDiffLines, ...commentsDiffLines]);

		newEditorDecorations.current = newEditorDecoration;
		oldEditor.commands.setMeta("updateDiffDecorators", oldEditorDecorations);
		newEditor.commands.setMeta("updateDiffDecorators", newEditorDecoration);
	};

	const { start: onUpdateWithDebounce } = useDebounce(() => {
		updateDiffDecorators();
	}, DEBOUNCDE_DELAY);

	useEffect(() => {
		if (!newEditor || newEditor.isDestroyed || !oldEditor || !commentEditorEvents) return;
		void updateDiffDecorators();

		const onEditorUpdate = ({ editor, transaction }: { editor: Editor; transaction: Transaction }) => {
			newEditorDecorations.current = newEditorDecorations.current.map(transaction.mapping, editor.state.doc);
			editor.commands.setMeta("updateDiffDecorators", newEditorDecorations.current);
			onUpdateWithDebounce();
		};

		newEditor.on("update", onEditorUpdate);
		const commentEditorEventsTokens = [];
		commentEditorEventsTokens.push(commentEditorEvents.on("update", () => void updateDiffDecorators()));
		commentEditorEventsTokens.push(commentEditorEvents.on("delete", () => void updateDiffDecorators()));
		return () => {
			newEditor.off("update", onEditorUpdate);
			commentEditorEventsTokens.forEach((token) => commentEditorEvents.off(token));
		};
	}, [newEditor, oldEditor, commentEditorEvents]);
};

export default useDiff;
