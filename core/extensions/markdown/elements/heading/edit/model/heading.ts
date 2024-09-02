import { stopExecution } from "@ext/markdown/elementsUtils/cursorFunctions";
import { mergeAttributes, Node, textblockTypeInputRule } from "@tiptap/core";
import getChildTextId from "@ext/markdown/elements/heading/logic/getChildTextId";
import { selecInsideSingleParagraph } from "@ext/markdown/elementsUtils/selecInsideSingleParagraph";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { AddMarkStep, ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
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
		return { levels: [1, 2, 3, 4] };
	},

	addAttributes() {
		return {
			id: {},
			level: { default: 1, rendered: false },
			isCustomId: { default: false, rendered: false },
		};
	},

	parseHTML() {
		const levels = [...this.options.levels];
		levels.shift();
		return [
			{ tag: `h1`, attrs: { level: 2 } },
			{ tag: `h5`, attrs: { level: 4 } },
			{ tag: `h6`, attrs: { level: 4 } },
			...levels.map((level: Level) => {
				return { tag: `h${level}`, attrs: { level } };
			}),
		];
	},

	renderHTML({ node }) {
		const id = node.attrs.isCustomId ? node.attrs.id : getChildTextId(node.textContent);
		const hasLevel = this.options.levels.includes(node.attrs.level);
		const level = hasLevel ? node.attrs.level : this.options.levels[0];
		return [`h${level === 1 && id === "article-title" ? 1 : level}`, mergeAttributes({ id }), 0];
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
					if (stopExecution(editor, this.name)) return false;

					return commands.toggleNode(this.name, "paragraph", attributes);
				},
		};
	},

	addKeyboardShortcuts() {
		const levels = [...this.options.levels];
		levels.shift();
		return {
			...levels.reduce(
				(items, level) => ({
					...items,
					...{
						[`Mod-Alt-${level}`]: () => {
							if (this.editor.state.selection.$from.parent === this.editor.state.doc.firstChild)
								return false;
							if (selecInsideSingleParagraph(this.editor.state))
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
		const levels = [...this.options.levels];
		levels.shift();
		return levels.map((level) => {
			return textblockTypeInputRule({
				find: new RegExp(`^(#{1,${level}})\\s$`),
				type: this.type,
				getAttributes: { level },
			});
		});
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("handleHeadings"),
				appendTransaction(transactions, oldState, newState) {
					if (oldState.doc.firstChild.textContent === newState.doc.firstChild.textContent) return null;
					const newTr = newState.tr;
					transactions.forEach((tr) => {
						if (!tr.docChanged) return;
						tr.steps.forEach((step) => {
							if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
								tr.doc.firstChild.content.forEach((node, offset) => {
									if (!node.marks) return;
									newTr.removeMark(offset, offset + node.nodeSize);
								});
								if (tr.doc.firstChild.attrs.level !== 1) newTr.setNodeAttribute(0, "level", 1);
							}
						});
					});
					return newTr;
				},
				filterTransaction(tr) {
					if (tr.docChanged) {
						let allowTr = true;
						tr.steps.forEach((step) => {
							if (step instanceof AddMarkStep) {
								const resolvedPos = tr.doc.resolve(step.from);
								if (resolvedPos.parent === tr.doc.firstChild) allowTr = false;
							}
						});

						return allowTr;
					}

					return true;
				},
			}),
		];
	},
});

export default Heading;
