import SuggestionTooltip from "@ext/StyleGuide/extension/SuggestionTooltip";
import { Editor, Mark, mergeAttributes } from "@tiptap/core";
import { DOMParser as TipTapDOMParser } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "prosemirror-state";

const getNodeByHTMLText = (text: string, editor: Editor) => {
	return TipTapDOMParser.fromSchema(editor.schema).parse(new DOMParser().parseFromString(text, "text/html"));
};

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		suggestion: { setSuggestion: (suggestions?: SuggestionItem[]) => ReturnType };
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
			setSuggestion:
				(suggestions) =>
				({ editor, state, dispatch }) => {
					if (!suggestions?.length || !dispatch) return false;

					const handleFindAndReplace = (findText: string, replaceText: string) => {
						let tr = state.tr;

						state.doc.descendants((node, pos) => {
							if (node.type.name === "paragraph" || node.type.name === "heading") {
								findText = getNodeByHTMLText(findText, editor).textContent;
								const regex = new RegExp(findText, "g");
								const matches = [...Array.from(node.textContent?.matchAll(regex) ?? [])];
								matches.forEach((match) => {
									if (match.index === undefined) return;
									const start = pos + 1 + match.index;
									const end = start + findText.length;
									const newNode = getNodeByHTMLText(replaceText, editor).child(0);
									tr = tr.replaceWith(start, end, newNode.content);
								});
								return false;
							}
						});

						dispatch(tr);
					};
					suggestions.forEach((suggestion) => {
						if (!suggestion.originalSentence) return;
						handleFindAndReplace(suggestion.originalSentence, suggestion.suggestion);
					});

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
							const target = event.target as HTMLElement;
							suggestionTooltip.removeTooltip();
							if (target.tagName !== "SUGGESTION") return;

							const name = target.getAttribute("name");
							const replaceText = target.getAttribute("text");
							const description = target.getAttribute("description");

							const pos = view.posAtDOM(target, 0);
							const resolvedPos = view.state.doc.resolve(pos);
							suggestionTooltip.setTooltip(target, {
								name,
								replaceText,
								description,
								onClick: (replaceText) => {
									let tr = view.state.tr;
									const newNode = getNodeByHTMLText(replaceText, this.editor);
									tr = tr.replaceWith(
										pos,
										pos + (resolvedPos.nodeAfter?.nodeSize ?? 0),
										newNode.child(0).content,
									);
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
									if (start == -1) {
										start = pos;
										originalText = mark.attrs.originalText;
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
