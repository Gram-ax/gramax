import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

const LineBreakers = Extension.create({
	name: "LineBreakers",
	priority: 800,
	addOptions() {
		return {};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					transformPastedHTML(html: string) {
						const body = /<body[\s\S]*?>([\s\S]*)<\/body>/.exec(html)?.[1];
						if (!body) return html;
						return new DOMParser().parseFromString(
							body.split("<br>").filter(Boolean).join("</p><p>"),
							"text/html",
						).documentElement.outerHTML;
					},
				},
			}),
		];
	},
});

export default LineBreakers;
