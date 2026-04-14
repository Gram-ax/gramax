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
					handlePaste(view, event) {
						if (!isTauri) return false;
						const html = event.clipboardData?.getData("text/html");
						if (!html) return false;

						const transformer = new TransformerMsO(articleProps, apiUrlCreator, isTauri, view);
						if (!transformer.canTransform(html)) return false;

						transformer.parseFromHTML(html);
						return true;
					},
					transformPastedHTML(html: string) {
						if (!html || isTauri) return html;

						const transformer = new TransformerMsO(articleProps, apiUrlCreator, false, null);
						if (transformer.canTransform(html)) {
							return transformer.parseFromHTMLSync(html);
						}

						return html;
					},
				},
			}),
		];
	},
});

export default CopyMsO;
