import horizontal_rule from "@ext/markdown/elements/hr/edit/model/hrSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node, nodeInputRule } from "@tiptap/core";
import { TextSelection } from "prosemirror-state";

interface HorizontalRuleOptions {
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		horizontalRule: {
			/**
			 * Add a horizontal rule
			 */
			setHorizontalRule: () => ReturnType;
		};
	}
}

const HorizontalRule = Node.create<HorizontalRuleOptions>({
	...getExtensionOptions({ schema: horizontal_rule, name: "horizontal_rule" }),

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [{ tag: "hr" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["hr", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
	},

	addCommands() {
		return {
			setHorizontalRule:
				() =>
				({ chain }) => {
					return (
						chain()
							.insertContent({ type: this.name })
							// set cursor after horizontal rule
							.command(({ tr, dispatch }) => {
								if (dispatch) {
									const { $to } = tr.selection;
									const posAfter = $to.end();

									if ($to.nodeAfter) {
										tr.setSelection(TextSelection.create(tr.doc, $to.pos));
									} else {
										// add node after horizontal rule if it’s the end of the document
										const node = $to.parent.type.contentMatch.defaultType?.create();

										if (node) {
											tr.insert(posAfter, node);
											tr.setSelection(TextSelection.create(tr.doc, posAfter));
										}
									}

									tr.scrollIntoView();
								}

								return true;
							})
							.run()
					);
				},
		};
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: /^(?:---|—-|___\s|\*\*\*\s)$/,
				type: this.type,
			}),
		];
	},
});

export default HorizontalRule;
