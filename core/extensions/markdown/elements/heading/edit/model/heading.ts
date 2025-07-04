import { getResultByActionData } from "@core-ui/ContextServices/ButtonStateService/hooks/useCurrentAction";
import { getNodeNameFromCursor } from "@core-ui/ContextServices/ButtonStateService/hooks/useType";
import { stopExecution } from "@ext/markdown/elementsUtils/cursorFunctions";
import { mergeAttributes, Node, InputRule, callOrReturn } from "@tiptap/core";
import getChildTextId from "@ext/markdown/elements/heading/logic/getChildTextId";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
import { editName as BLOCK_FIELD } from "@ext/markdown/elements/blockContentField/consts";
import { editName as BLOCK_PROPERTY } from "@ext/markdown/elements/blockProperty/consts";
// import updateId from "@ext/markdown/elements/heading/edit/plugins/updateId";

export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingOptions {
	levels: Level[];
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		heading: {
			setHeading: (attributes: { level: Level }) => ReturnType;
			toggleHeading: (attributes: { level: Level }) => ReturnType;
		};
	}
}

const Heading = Node.create<HeadingOptions>({
	name: "heading",

	group: "block",
	content: "inline*",
	defining: true,

	addOptions() {
		return { levels: [2, 3, 4, 5, 6] };
	},

	addAttributes() {
		return {
			id: {},
			level: { default: 6, rendered: false },
			isCustomId: { default: false, rendered: false },
		};
	},

	parseHTML() {
		return [
			{ tag: `h1`, attrs: { level: 2 } },
			...this.options.levels.map((level: Level) => {
				return { tag: `h${level}`, attrs: { level } };
			}),
		];
	},

	renderHTML({ node }) {
		const id = node.attrs.isCustomId ? node.attrs.id : getChildTextId(node.textContent);
		const hasLevel = this.options.levels.includes(node.attrs.level);
		const level = hasLevel ? node.attrs.level : this.options.levels[0];
		return [`h${level}`, mergeAttributes({ id }), 0];
	},

	addCommands() {
		return {
			setHeading:
				(attributes) =>
				({ commands }) => {
					if (!this.options.levels.includes(attributes.level)) {
						return false;
					}

					return commands.setNode(this.name, attributes);
				},
			toggleHeading:
				(attributes) =>
				({ commands, editor }) => {
					if (!this.options.levels.includes(attributes.level)) return false;
					if (stopExecution(editor, this.name, [BLOCK_FIELD, BLOCK_PROPERTY])) return false;

					return commands.toggleNode(this.name, "paragraph", attributes);
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			...this.options.levels
				.filter((level) => level < 5)
				.reduce(
					(items, level) => ({
						...items,
						...{
							[`Mod-Alt-${level}`]: () => {
								if (this.editor.state.selection.$from.parent === this.editor.state.doc.firstChild)
									return false;

								return this.editor.commands.toggleHeading({ level });
							},
						},
					}),
					{},
				),
			Enter: ({ editor }) => {
				const { $from } = editor.state.selection;
				if ($from.parent.type.name !== "heading") return false;
				if ($from.parentOffset === 0) return false;
				if ($from.parentOffset + 2 === $from.parent.nodeSize) return false;

				return editor.chain().focus().splitBlock().toggleNode("paragraph", this.name).run();
			},
		};
	},

	addInputRules() {
		return this.options.levels
			.filter((level) => level < 5)
			.map((level) => {
				return new InputRule({
					find: new RegExp(`^(#{1,${level}})\\s$`),
					handler: ({ state, range, match }) => {
						const $start = state.doc.resolve(range.from);
						const { actions, headingLevel } = getNodeNameFromCursor(state);

						const { disabled } = getResultByActionData({
							actions,
							currentNode: { action: "heading", attrs: { level: headingLevel } },
							selection: state.selection,
						});

						if (disabled) {
							return null;
						}

						const attributes = callOrReturn({ level }, undefined, match) || {};

						if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), this.type)) {
							return null;
						}

						state.tr
							.delete(range.from, range.to)
							.setBlockType(range.from, range.from, this.type, attributes);
					},
				});
			});
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("updateArticleTitle"),
				appendTransaction(transactions, oldState, newState) {
					if (oldState.doc.firstChild.childCount === newState.doc.firstChild.childCount) return null;
					const newTr = newState.tr;
					transactions.forEach((tr) => {
						if (!tr.docChanged) return;
						tr.steps.forEach((step) => {
							if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
								tr.doc.firstChild.content.forEach((node, offset) => {
									if (!node.marks) return;
									newTr.removeMark(offset, offset + node.nodeSize + 1);
								});
							}
						});
					});
					return newTr;
				},
				filterTransaction(tr, state) {
					if (!tr.docChanged) return true;

					const newFirstChild = tr.doc.firstChild;
					if (newFirstChild === state.doc.firstChild) return true;
					if (!newFirstChild.childCount) return true;
					if (newFirstChild.childCount === 1 && newFirstChild.firstChild.type.name === "text") return true;

					return false;
				},
			}),
		];
	},
});

export default Heading;
