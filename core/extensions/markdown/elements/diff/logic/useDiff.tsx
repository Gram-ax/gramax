import { useDebounce } from "@core-ui/hooks/useDebounce";
import addDecorations from "@ext/markdown/elements/diff/logic/addDecorations";
import showDiffs from "@ext/markdown/elements/diff/logic/showDiffs";
import { PluginKey, Transaction } from "@tiptap/pm/state";
import { AddMarkStep, RemoveMarkStep } from "@tiptap/pm/transform";
import { DecorationSet } from "@tiptap/pm/view";
import { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";

const DEBOUNCDE_DELAY = 250;
const diffNewEditorPluginKey = new PluginKey("diff-new-editor");
const diffOldEditorPluginKey = new PluginKey("diff-old-editor");

const marksToIgnore = ["comment", "link"];
function ignoreMarkTransactions(transaction: Transaction) {
	const isAddCommentMark =
		transaction.steps.length === 1 &&
		transaction.steps[0] instanceof AddMarkStep &&
		marksToIgnore.includes(transaction.steps[0].mark.type.name);
	if (isAddCommentMark) return true;

	const isDeleteCommentMark =
		transaction.steps.length === 1 &&
		transaction.steps[0] instanceof RemoveMarkStep &&
		marksToIgnore.includes(transaction.steps[0].mark.type.name);
	if (isDeleteCommentMark) return true;

	const isUpdateCommentMark =
		transaction.steps.length === 2 &&
		((transaction.steps[0] instanceof RemoveMarkStep && transaction.steps[1] instanceof AddMarkStep) ||
			(transaction.steps[0] instanceof AddMarkStep && transaction.steps[1] instanceof RemoveMarkStep)) &&
		marksToIgnore.includes(transaction.steps[0].mark.type.name) &&
		marksToIgnore.includes(transaction.steps[1].mark.type.name);
	if (isUpdateCommentMark) return true;

	return false;
}

const useDiff = ({ editor: newEditor, oldContentEditor }: { editor: Editor; oldContentEditor: Editor }) => {
	const newEditorDecorations = useRef<DecorationSet>(null);

	const updateDiffDecorators = () => {
		const { newEditorDecoration, oldEditorDecorations } = showDiffs(oldContentEditor, newEditor);
		newEditorDecorations.current = newEditorDecoration;
		addDecorations(newEditor, newEditorDecoration, diffNewEditorPluginKey);
		addDecorations(oldContentEditor, oldEditorDecorations, diffOldEditorPluginKey);
	};

	const { start: onUpdateWithDebounce } = useDebounce(
		({ transaction }: { editor: Editor; transaction: Transaction }) => {
			if (ignoreMarkTransactions(transaction)) return;
			updateDiffDecorators();
		},
		DEBOUNCDE_DELAY,
	);

	useEffect(() => {
		if (!newEditor || newEditor.isDestroyed || !oldContentEditor) return;
		updateDiffDecorators();

		const onEditorUpdate = ({ editor, transaction }: { editor: Editor; transaction: Transaction }) => {
			newEditorDecorations.current = newEditorDecorations.current.map(transaction.mapping, editor.state.doc);
			addDecorations(newEditor, newEditorDecorations.current, diffNewEditorPluginKey);
			onUpdateWithDebounce({ transaction, editor });
		};

		newEditor.on("update", onEditorUpdate);
		return () => {
			newEditor.off("update", onEditorUpdate);
		};
	}, [newEditor, oldContentEditor]);
};

export default useDiff;
