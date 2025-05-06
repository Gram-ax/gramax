import { Extension } from "@tiptap/core";
import { AddMarkStep } from "@tiptap/pm/transform";
import { Plugin, PluginKey } from "prosemirror-state";

const ArticleTitleHelpers = Extension.create<{ onTitleLoseFocus: ({ newTitle }: { newTitle: string }) => void }>({
	name: "ArticleTitleHelpers",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("ArticleTitleHelpers"),
				appendTransaction: (transactions, oldState, newState) => {
					const isDiffEditor = this.editor.storage.diff;
					if (isDiffEditor) return;

					const { selection: newSelection } = newState;
					const { selection: oldSelection } = oldState;

					const hasBlurTransaction = transactions.some((transaction) => transaction.getMeta("blur"));
					if (oldSelection.$anchor.parent !== oldState.doc.firstChild && !hasBlurTransaction) return;
					if (newSelection.$anchor.parent === newState.doc.firstChild && !hasBlurTransaction) return;
					if (this.options.onTitleLoseFocus)
						this.options.onTitleLoseFocus({ newTitle: newState.doc.firstChild.textContent });

					return null;
				},
				filterTransaction(tr) {
					if (!tr.docChanged) return true;
					let allowTr = true;

					tr.steps.some((step) => {
						if (!(step instanceof AddMarkStep)) return;
						const clampedPos = Math.max(Math.min(step.from, tr.doc.content.size), 0);
						const resolvedPos = tr.doc.resolve(clampedPos);

						if (resolvedPos.parent !== tr.doc.firstChild) return;
						allowTr = false;
						return true;
					});

					return allowTr;
				},
			}),
		];
	},
});

export default ArticleTitleHelpers;
