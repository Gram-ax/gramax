import code_block from "@ext/markdown/elements/fence/edit/model/codeBlockSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node, textblockTypeInputRule } from "@tiptap/core";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { EditorState, Plugin, PluginKey, TextSelection } from "prosemirror-state";

interface CodeBlockOptions {
	languageClassPrefix: string;
	exitOnTripleEnter: boolean;
	exitOnArrowDown: boolean;
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		codeBlock: {
			setCodeBlock: (attributes?: { language: string }) => ReturnType;
			toggleCodeBlock: (attributes?: { language: string }) => ReturnType;
			multilineCodeBlock: (attributes?: { language: string }) => ReturnType;
		};
	}
}

const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;
const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;

const CodeBlock = Node.create<CodeBlockOptions>({
	...getExtensionOptions({ schema: code_block, name: "code_block" }),

	addOptions() {
		return {
			languageClassPrefix: "language-",
			exitOnTripleEnter: true,
			exitOnArrowDown: true,
			HTMLAttributes: {},
		};
	},

	addAttributes() {
		return {
			params: {
				default: null,
				parseHTML: (element) => {
					const { languageClassPrefix } = this.options;
					const classNames = [...(element.firstElementChild?.classList || [])];
					const languages = classNames
						.filter((className) => className.startsWith(languageClassPrefix))
						.map((className) => className.replace(languageClassPrefix, ""));
					const language = languages[0];

					if (!language) {
						return null;
					}

					return language;
				},
				rendered: false,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "pre",
				preserveWhitespace: "full",
			},
		];
	},

	renderHTML({ node, HTMLAttributes }) {
		HTMLAttributes.class = "prism-code";
		return [
			"pre",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			["div", { class: node.attrs.language ? this.options.languageClassPrefix + node.attrs.language : null }, 0],
		];
	},

	addCommands() {
		return {
			setCodeBlock:
				() =>
				({ editor }) => {
					return editor
						.chain()
						.insertContent({
							type: "code_block",
							attrs: { params: "" },
							content: [],
						})
						.focus()
						.run();
				},

			toggleCodeBlock:
				(attributes) =>
				({ commands }) => {
					return commands.toggleNode(this.name, "paragraph", attributes);
				},

			multilineCodeBlock:
				(attributes) =>
				({ state, dispatch }) => {
					const { $from, $to } = state.selection;

					const startOfFirstParagraph = $from.before(1);
					const endOfLastParagraph = $to.after(1);

					const paragraphNodes = [];
					state.doc.nodesBetween(startOfFirstParagraph, endOfLastParagraph, (node) => {
						if (node.type.name === "paragraph") paragraphNodes.push(node);
					});

					const codeContent = paragraphNodes.map((node) => node.textContent).join("\n");
					const codeBlock = state.schema.nodes.code_block.create(attributes, state.schema.text(codeContent));

					const tr = state.tr.replaceRangeWith(startOfFirstParagraph, endOfLastParagraph, codeBlock);
					const newPos = tr.doc.resolve(startOfFirstParagraph + codeBlock.nodeSize - 1);
					tr.setSelection(TextSelection.create(tr.doc, newPos.pos));

					dispatch(tr);
					return true;
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			Tab: ({ editor }) => {
				const { state } = editor;
				const { $from, $to } = state.selection;
				if ($from.parent.type.name !== this.name) return false;
				const isSelected = $from.pos !== $to.pos;
				const positions: number[] = [];
				const tab = ProsemirrorNode.fromJSON(editor.schema, { type: "text", text: "	" });
				if (isSelected) {
					const { lines, startPosition } = getLines(state);
					positions.push(startPosition);
					lines.slice(0, -1).forEach((line, idx) => {
						positions.push(positions[idx] + line.length + 1);
					});
				}

				return editor
					.chain()
					.command(({ tr }) => {
						if (!isSelected) tr.insert($from.pos, tab);
						else positions.reverse().forEach((pos) => tr.insert(pos, tab));
						return true;
					})
					.run();
			},

			"Shift-Tab": ({ editor }) => {
				const state = editor.state;
				if (state.selection.$from.parent.type.name !== this.name) return false;
				const positions: number[] = [];
				const { lines, startPosition } = getLines(state);
				positions.push(startPosition);
				lines.slice(0, -1).forEach((line, idx) => {
					positions.push(positions[idx] + line.length + 1);
				});
				const resPos = positions.map((p, idx) => (lines[idx][0] === "	" ? p : null)).filter((p) => p);
				return editor
					.chain()
					.command(({ tr }) => {
						resPos.reverse().forEach((pos) => tr.delete(pos, pos + 1));
						return true;
					})
					.run();
			},

			"Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),

			// remove code block when at start of document or code block is empty
			Backspace: () => {
				const { empty, $anchor } = this.editor.state.selection;
				const isAtStart = $anchor.pos === 1;

				if (!empty || $anchor.parent.type.name !== this.name) {
					return false;
				}

				if (isAtStart || !$anchor.parent.textContent.length) {
					return this.editor.commands.toggleNode(this.name, "paragraph");
				}

				return false;
			},

			// exit node on triple enter
			Enter: ({ editor }) => {
				if (!this.options.exitOnTripleEnter) {
					return false;
				}

				const { state } = editor;
				const { selection } = state;
				const { $from, empty } = selection;

				if (!empty || $from.parent.type !== this.type) {
					return false;
				}

				const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
				const endsWithDoubleNewline = $from.parent.textContent.endsWith("\n\n");

				if (!isAtEnd || !endsWithDoubleNewline) {
					return false;
				}

				return editor
					.chain()
					.command(({ tr }) => {
						tr.delete($from.pos - 2, $from.pos);
						return true;
					})
					.exitCode()
					.run();
			},

			ArrowDown: ({ editor }) => {
				if (!this.options.exitOnArrowDown) {
					return false;
				}

				const { state } = editor;
				const { selection, doc } = state;
				const { $from, empty } = selection;

				if (!empty || $from.parent.type !== this.type) {
					return false;
				}

				const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;

				if (!isAtEnd) {
					return false;
				}

				const after = $from.after();

				if (after === undefined) {
					return false;
				}

				const nodeAfter = doc.nodeAt(after);

				if (nodeAfter) {
					return false;
				}

				return editor.commands.exitCode();
			},
		};
	},

	addInputRules() {
		return [
			textblockTypeInputRule({
				find: backtickInputRegex,
				type: this.type,
				getAttributes: (match) => ({
					language: match[1],
				}),
			}),
			textblockTypeInputRule({
				find: tildeInputRegex,
				type: this.type,
				getAttributes: (match) => ({
					language: match[1],
				}),
			}),
		];
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("codeBlockVSCodeHandler"),
				props: {
					handlePaste: (view, event) => {
						if (!event.clipboardData) {
							return false;
						}

						if (this.editor.isActive(this.type.name)) {
							return false;
						}

						const text = event.clipboardData.getData("text/plain");
						const vscode = event.clipboardData.getData("vscode-editor-data");
						const vscodeData = vscode ? JSON.parse(vscode) : undefined;
						const language = vscodeData?.mode;

						if (!text || !language) {
							return false;
						}

						const { tr } = view.state;

						tr.replaceSelectionWith(this.type.create({ language }));

						tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, tr.selection.from - 2))));

						tr.insertText(text.replace(/\r\n?/g, "\n"));

						tr.setMeta("paste", true);

						view.dispatch(tr);

						return true;
					},
				},
			}),
		];
	},
});

const getLines = (state: EditorState) => {
	const { $from, $to } = state.selection;
	let startPosition = $from.pos;
	const parentOffset = $from.parentOffset;
	for (let i = 0; i < parentOffset; i++) {
		const char = state.doc.textBetween(startPosition - i, startPosition - i + 1);
		if (char === "\n") {
			startPosition = startPosition - i + 1;
			i = parentOffset;
		}
		if (i === parentOffset - 1) startPosition = startPosition - i - 1;
	}
	const textBetween = state.doc.textBetween(startPosition, $to.pos);
	return { lines: textBetween.split("\n"), startPosition };
};

export default CodeBlock;
