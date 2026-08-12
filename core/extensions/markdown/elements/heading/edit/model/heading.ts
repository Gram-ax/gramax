import { getResultByActionData } from "@core-ui/ContextServices/ButtonStateService/hooks/useCurrentAction";
import { getFilteredActions } from "@core-ui/ContextServices/ButtonStateService/hooks/useType";
import { getActiveNodesFromSelection } from "@core-ui/ContextServices/ButtonStateService/utils/getActiveNodesFromSelection";
import listItemToHeading from "@ext/markdown/elements/heading/edit/logic/listItemToHeading";
import getChildTextId from "@ext/markdown/elements/heading/logic/getChildTextId";
import { stopExecution } from "@ext/markdown/elementsUtils/cursorFunctions";
import { callOrReturn, InputRule, mergeAttributes, Node } from "@tiptap/core";
import { handleAltNumbers } from "../logic/keymaps/handleAltNumbers";
import { handleBackspace } from "../logic/keymaps/handleBackspace";
import { handleEnter } from "../logic/keymaps/handleEnter";
import updateId from "../plugins/updateId";

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

export const AVAILABLE_LEVELS = [2, 3, 4, 5, 6] as Level[];

const Heading = Node.create<HeadingOptions>({
	name: "heading",

	group: "block",
	content: "inline*",
	defining: true,

	addOptions() {
		return { levels: AVAILABLE_LEVELS };
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
		const id = node.attrs.id ?? getChildTextId(node.textContent);
		const hasLevel = this.options.levels.includes(node.attrs.level);
		const level = hasLevel ? node.attrs.level : this.options.levels[0];
		return [`h${level}`, mergeAttributes({ id }), 0];
	},

	addProseMirrorPlugins() {
		return [updateId(this.editor)];
	},

	addCommands() {
		return {
			setHeading:
				(attributes) =>
				({ commands, editor }) => {
					if (!this.options.levels.includes(attributes.level)) {
						return false;
					}

					if (listItemToHeading(editor, attributes.level)) return true;

					return commands.setNode(this.name, attributes);
				},
			toggleHeading:
				(attributes) =>
				({ commands, state, editor }) => {
					if (!this.options.levels.includes(attributes.level)) return false;

					if (listItemToHeading(editor, attributes.level)) return true;

					if (stopExecution(state, this.name)) return false;

					return commands.toggleNode(this.name, "paragraph", attributes);
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			...handleAltNumbers(this.editor, this.options.levels),
			Backspace: ({ editor }) => handleBackspace(editor),
			Enter: ({ editor }) => handleEnter(editor),
		};
	},

	addInputRules() {
		return this.options.levels
			.filter((level) => level < 5)
			.map((level) => {
				return new InputRule({
					find: new RegExp(`^(#{1,${level}})\\s$`),
					handler: ({ state, range, match }) => {
						const Start = state.doc.resolve(range.from);

						const isInsideListItem = Start.depth >= 2 && Start.node(2).type.name === "listItem";
						if (isInsideListItem) return null;

						const nodes = getActiveNodesFromSelection(state);
						const actions = getFilteredActions(nodes);
						const headingLevel = nodes.find(({ node }) => node.type.name === "heading")?.node.attrs.level;

						const { disabled } = getResultByActionData({
							actions,
							currentNode: { action: "heading", attrs: { level: headingLevel } },
							selection: state.selection,
						});

						if (disabled) {
							return null;
						}

						const attributes = callOrReturn({ level }, undefined, match) || {};

						if (!Start.node(-1).canReplaceWith(Start.index(-1), Start.indexAfter(-1), this.type)) {
							return null;
						}

						state.tr
							.delete(range.from, range.to)
							.setBlockType(range.from, range.from, this.type, attributes);
					},
				});
			});
	},
});

export default Heading;
