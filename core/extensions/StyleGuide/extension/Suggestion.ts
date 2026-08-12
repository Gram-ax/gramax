import SuggestionTooltip from "@ext/StyleGuide/extension/SuggestionTooltip";
import applySuggestions from "@ext/StyleGuide/logic/applySuggestions";
import buildReplacement from "@ext/StyleGuide/logic/buildReplacement";
import { getMarkRange, Mark, mergeAttributes } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "prosemirror-state";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		suggestion: { markSuggestions: (suggestions?: SuggestionItem[]) => ReturnType };
	}
}

export interface SuggestionItem {
	suggestion: string;
	originalSentence?: string;
}

export const Suggestion = Mark.create({
	name: "suggestion",

	addOptions() {
		return {};
	},

	addAttributes() {
		return {
			text: { default: null },
			name: { default: null },
			description: { default: null },
			originalText: { default: null },
			class: { default: "suggestion" },
		};
	},

	parseHTML() {
		return [{ tag: "suggestion" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["suggestion", mergeAttributes(HTMLAttributes), 0];
	},

	addCommands() {
		return {
			markSuggestions:
				(suggestions) =>
				({ state, dispatch }) => {
					if (!suggestions?.length || !dispatch) return false;

					dispatch(applySuggestions(state.tr, this.type, suggestions));
					return true;
				},
		};
	},

	addProseMirrorPlugins() {
		const currentType = this.type;
		const suggestionTooltip = new SuggestionTooltip(this.editor.view, this.editor);
		return [
			new Plugin({
				key: new PluginKey("suggestion_click"),
				props: {
					handleDOMEvents: {
						click: (view, event) => {
							suggestionTooltip.removeTooltip();
							const target = (event.target as HTMLElement)?.closest?.("suggestion") as HTMLElement;
							if (!target) return;

							const pos = view.posAtDOM(target, 0);
							const resolvedPos = view.state.doc.resolve(pos);
							const mark = (resolvedPos.nodeAfter?.marks ?? []).find((mark) => mark.type === currentType);
							const range = getMarkRange(resolvedPos, currentType, mark?.attrs);
							if (!range) return;

							suggestionTooltip.setTooltip(target, {
								name: mark?.attrs.name ?? target.getAttribute("name"),
								replaceText: mark?.attrs.text ?? target.getAttribute("text"),
								description: mark?.attrs.description ?? target.getAttribute("description"),
								onClick: (replaceText) => {
									const { from, to } = range;
									const { tr, doc, schema } = view.state;

									if (replaceText) {
										const marks = buildReplacement(doc, from, to, replaceText, currentType);
										const nodes = Array.from(replaceText, (char, index) =>
											schema.text(char, marks[index]),
										);
										tr.replaceWith(from, to, Fragment.fromArray(nodes));
									} else tr.delete(from, to);

									view.dispatch(tr);
									suggestionTooltip.removeTooltip();
								},
							});
						},
					},
				},
			}),
			new Plugin({
				appendTransaction(transactions, _, newState) {
					const transaction = transactions.find((tr) => tr.docChanged);
					if (!transaction) return null;
					const tr = newState.tr;
					let start = -1;
					let text = "";
					let originalText = "";
					newState.doc.descendants((node, pos) => {
						let haveSug = false;
						if (node.isText) {
							haveSug = node.marks.some((mark) => {
								if (mark.type.name == Suggestion.name) {
									if (start == -1 || originalText !== mark.attrs.originalText) {
										if (start !== -1 && text !== originalText) {
											tr.removeMark(start, pos, currentType);
										}
										start = pos;
										originalText = mark.attrs.originalText;
										text = "";
									}
									text += node.text;
									return true;
								}
							});
						}
						if (!haveSug) {
							if (text !== originalText) tr.removeMark(start, pos, currentType);
							start = -1;
							originalText = text = "";
						}
					});
					if (text !== originalText) tr.removeMark(start, newState.doc.content.size, currentType);
					return tr;
				},
			}),
		];
	},
});
