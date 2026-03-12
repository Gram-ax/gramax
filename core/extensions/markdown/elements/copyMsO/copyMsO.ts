import { getExecutingEnvironment } from "@app/resolveModule/env";
import TransformerMsO from "@ext/markdown/elements/copyMsO/transfomerMsO";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

const CopyMsO = Extension.create({
	name: "copyMsO",
	priority: 1000,
	addOptions() {
		return {};
	},

	addProseMirrorPlugins() {
		const articleProps = this.options.articleProps;
		const apiUrlCreator = this.options.apiUrlCreator;
		const isTauri = getExecutingEnvironment() === "tauri";

		return [
			new Plugin({
				props: {
					transformPastedHTML(html: string, view) {
						if (html) {
							const transformer = new TransformerMsO(articleProps, apiUrlCreator, isTauri, view);

							if (transformer.canTransform(html)) {
								transformer.parseFromHTML(html);
								return "";
							}

							return html;
						}
					},
				},
			}),
		];
	},
});

export default CopyMsO;
