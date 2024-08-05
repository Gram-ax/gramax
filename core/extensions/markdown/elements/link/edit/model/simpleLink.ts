import { Mark, mergeAttributes } from "@tiptap/react";

const simpleLink = Mark.create({
	name: "link",
	priority: 1000,
	keepOnSplit: false,

	addAttributes() {
		return {
			class: { default: null },
			href: { default: null },
			hash: { default: null },
			newHref: { default: null },
			resourcePath: { default: null },
		};
	},

	parseHTML() {
		return [{ tag: 'a[href]:not([href *= "javascript:" i])' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["a", mergeAttributes(HTMLAttributes), 0];
	},
});

export default simpleLink;
