import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { Extension } from "@tiptap/core";
import { AddMarkStep } from "@tiptap/pm/transform";
import { Plugin, PluginKey } from "prosemirror-state";

const ArticleTitleHelpers = Extension.create<{
	onTitleLoseFocus: ({
		newTitle,
		articleProps,
		apiUrlCreator,
	}: {
		newTitle: string;
		articleProps: ClientArticleProps;
		apiUrlCreator: ApiUrlCreator;
	}) => void;
	articleProps: ClientArticleProps;
	apiUrlCreator: ApiUrlCreator;
}>({
	name: "ArticleTitleHelpers",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("ArticleTitleHelpers"),
				appendTransaction: (transactions, oldState, newState) => {
					const { selection: newSelection } = newState;
					const { selection: oldSelection } = oldState;

					const newTr = newState.tr;
					const someTransactionChangedDoc = transactions.some((transaction) => transaction.docChanged);
					if (someTransactionChangedDoc) {
						newTr.doc.firstChild.content.forEach((node, offset) => {
							if (!node.marks) return;
							newTr.removeMark(offset, offset + node.nodeSize + 1);
						});
					}

					const returnedValue = someTransactionChangedDoc ? newTr : null;

					const hasBlurTransaction = transactions.some((transaction) => transaction.getMeta("blur"));
					if (oldSelection.$anchor.parent !== oldState.doc.firstChild && !hasBlurTransaction) return returnedValue;
					if (newSelection.$anchor.parent === newState.doc.firstChild && !hasBlurTransaction) return returnedValue;
					if (!this.options.onTitleLoseFocus) return returnedValue;

					this.options.onTitleLoseFocus({
						newTitle: newState.doc.firstChild.textContent,
						articleProps: this.options.articleProps,
						apiUrlCreator: this.options.apiUrlCreator,
					});

					return returnedValue;
				},
				filterTransaction(tr, state) {
					if (!tr.docChanged) return true;
					const newFirstChild = tr.doc.firstChild;

					if (newFirstChild === state.doc.firstChild) return true;
					if (!newFirstChild.childCount) return true;
					if (newFirstChild.childCount === 1 && newFirstChild.firstChild.type.name === "text") return true;
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
