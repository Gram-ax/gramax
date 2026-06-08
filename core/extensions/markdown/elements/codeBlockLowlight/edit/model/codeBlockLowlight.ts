import CodeBlockComponent from "@ext/markdown/elements/codeBlockLowlight/edit/component/CodeBlockComponent";
import getBackspaceShortcuts from "@ext/markdown/elements/codeBlockLowlight/edit/logic/keys/Backspace";
import getShiftTabShortcuts from "@ext/markdown/elements/codeBlockLowlight/edit/logic/keys/ShiftTab";
import getTabShortcuts from "@ext/markdown/elements/codeBlockLowlight/edit/logic/keys/Tab";
import lowlight from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import { LowlightPlugin } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightPlugin";
import code_block from "@ext/markdown/elements/codeBlockLowlight/edit/model/schema";
import inputRuleHandler from "@ext/markdown/elements/list/edit/logic/inputRuleHandler";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { InputRule } from "@tiptap/core";
import CodeBlockLowlight, { type CodeBlockLowlightOptions } from "@tiptap/extension-code-block-lowlight";
import type { Plugin } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TextSelection } from "prosemirror-state";

interface CodeBlockOptions extends CodeBlockLowlightOptions {
	monochromeClassName: string;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		code_block: {
			multilineCodeBlock: () => ReturnType;
		};
	}
}

export const languageClassPrefix = "language-";
const indentedCodeBlockInputRegex = /^(\s{4})(.*)$/;

const ExtendedCodeBlockLowlight = CodeBlockLowlight.extend<CodeBlockOptions>({
	priority: 999,
	...getExtensionOptions({ schema: code_block, name: "code_block" }),

	addOptions() {
		return {
			...this.parent?.(),
			lowlight,
			defaultLanguage: "none",
			exitOnTripleEnter: true,
			exitOnArrowDown: true,
			monochromeClassName: "monochrome-code-block",
			languageClassPrefix: languageClassPrefix,
			HTMLAttributes: {},
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(CodeBlockComponent);
	},

	addCommands() {
		return {
			...(this.parent?.() || []),
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
					const codeBlock = state.schema.nodes.code_block.create(
						attributes,
						codeContent ? state.schema.text(codeContent) : undefined,
					);

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
			...(this.parent?.() || []),
			...addShortcuts([getShiftTabShortcuts(), getTabShortcuts(), getBackspaceShortcuts()], this.name),
		};
	},

	addProseMirrorPlugins() {
		// I know it's a hack, but it's the only way to replace the lowlight plugin
		const pluginsWithoutLowlight =
			this.parent?.().filter((plugin) => (plugin as Plugin & { key: string })?.key !== "lowlight$") || [];
		return [
			...pluginsWithoutLowlight,
			LowlightPlugin({
				name: this.name,
				lowlight,
				defaultLanguage: this.options.defaultLanguage,
			}),
		];
	},

	addInputRules() {
		return [
			...this.parent(),
			inputRuleHandler(
				new InputRule({
					find: indentedCodeBlockInputRegex,
					handler: ({ state, range, match }) => {
						const [, , content] = match;

						const tr = state.tr.delete(range.from, range.to);

						tr.setBlockType(range.from, range.from, this.type);

						if (content) {
							tr.insertText(content, range.from);
						}
					},
					// nead set `undoable: false` after udate tiptap
					// https://github.com/ueberdosis/tiptap/blob/d9daae031a4f72ae81af039a721df66f5c0c2696/packages/core/src/InputRule.ts#L36
				}),
			),
		];
	},
});

export default ExtendedCodeBlockLowlight;
