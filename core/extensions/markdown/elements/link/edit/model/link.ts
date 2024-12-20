import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import PageDataContext from "@core/Context/PageDataContext";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { linkPastePlugin } from "@ext/markdown/elements/link/edit/logic/linkPastePlugin";
import { hoverTooltip } from "@ext/markdown/elements/link/edit/model/helpers/termsTooltip";
import simpleLink from "@ext/markdown/elements/link/edit/model/simpleLink";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import space from "@ext/markdown/logic/keys/marks/space";
import { Mark, markPasteRule, mergeAttributes } from "@tiptap/core";
import { find } from "linkifyjs";
import { autolink } from "./helpers/autolink";
import { editTooltip } from "./helpers/editTooltip";
import { pasteHandler } from "./helpers/pasteHandler";

export interface LinkOptions {
	autolink: boolean;
	linkOnPaste: boolean;
	apiUrlCreator?: ApiUrlCreator;
	pageDataContext?: PageDataContext;
	catalogProps?: ClientCatalogProps;
	HTMLAttributes: Record<string, any>;
	validate?: (url: string) => boolean;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		link: {
			toggleLink: (attributes: { href: string; target?: string }) => ReturnType;
			unsetLink: () => ReturnType;
		};
	}
}

export const Link = Mark.create<LinkOptions>({
	...simpleLink,

	inclusive() {
		return this.options.autolink;
	},

	addOptions() {
		return {
			linkOnPaste: true,
			autolink: true,
			HTMLAttributes: {
				target: "_self",
				rel: "noopener noreferrer nofollow",
			},
			validate: undefined,
		};
	},

	addAttributes() {
		return {
			href: { default: null },
			hash: { default: null },
			newHref: { default: null },
			resourcePath: { default: null },
			class: { default: this.options.HTMLAttributes.class },
		};
	},

	parseHTML() {
		return [{ tag: 'a[href]:not([href *= "javascript:" i])' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["a", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			toggleLink:
				(attributes) =>
				({ chain, editor, state }) => {
					const { from, to } = state.selection;
					let linkInSelection = false;

					state.doc.nodesBetween(from, to, (node) => {
						if (node.marks.some((mark) => mark.type.name === this.name)) {
							linkInSelection = true;
						}
					});

					if (linkInSelection) {
						return chain().unsetMark(this.name).setMeta("preventAutolink", true).run();
					}

					if (getSelectedText(state)) {
						return chain()
							.toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
							.setMeta("preventAutolink", true)
							.focus(editor.state.tr.selection.to - 1)
							.run();
					}

					return chain()
						.toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
						.setMeta("preventAutolink", true)
						.run();
				},
			unsetLink:
				() =>
				({ chain }) => {
					return chain().unsetMark(this.name).setMeta("preventAutolink", true).run();
				},
		};
	},

	addPasteRules() {
		return [
			markPasteRule({
				find: (text) =>
					find(text)
						.filter((link) => {
							if (this.options.validate) {
								return this.options.validate(link.value);
							}

							return true;
						})
						.filter((link) => link.isLink)
						.map((link) => ({
							text: link.value,
							index: link.start,
							data: link,
						})),
				type: this.type,
				getAttributes: (match) => ({
					href: match.data?.href,
				}),
			}),
		];
	},

	addProseMirrorPlugins() {
		const plugins = [];

		if (this.options.autolink) {
			plugins.push(autolink({ type: this.type, validate: this.options.validate }));
		}

		if (this.options.linkOnPaste) {
			plugins.push(pasteHandler({ editor: this.editor, type: this.type }));
		}

		return plugins;
	},
});

export default Link.extend({
	addProseMirrorPlugins() {
		const plugins = [];

		plugins.push(editTooltip(this.editor, this.options.apiUrlCreator));
		plugins.push(linkPastePlugin(this.editor));
		plugins.push(
			hoverTooltip(
				this.editor,
				this.options.apiUrlCreator,
				this.options.pageDataContext,
				this.options.catalogProps,
			),
		);

		return plugins;
	},
	addKeyboardShortcuts() {
		return addShortcuts(
			[
				{ key: "Space", focusShouldBeInsideNode: false, rules: [space("unsetLink")] },
				{
					key: "Mod-k",
					focusShouldBeInsideNode: false,
					rules: [
						({ editor }) =>
							this.editor.commands.toggleLink({ href: "", target: getSelectedText(editor.state) }),
					],
				},
			],
			this.type.name,
		);
	},
});
