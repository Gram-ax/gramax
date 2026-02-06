import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { format } from "@ext/markdown/elements/image/render/logic/imageTransformer";

const CLEAR_CROP = { x: 0, y: 0, w: 100, h: 100 };

const imageNodeFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		const newFormat =
			(node.attrs?.crop &&
				typeof node.attrs.crop !== "string" &&
				(node.attrs.crop.w !== 100 || node.attrs.crop.h !== 100)) ||
			node.attrs?.objects?.length > 0 ||
			node.attrs?.scale ||
			node.attrs?.float;

		const hasSize = node.attrs?.width && node.attrs?.height;
		if (newFormat) {
			const attrs = {
				src: node.attrs.src,
				alt: node.attrs.alt,
				title: node.attrs.title,
				...format(
					node.attrs?.width,
					node.attrs?.height,
					node.attrs?.crop ?? CLEAR_CROP,
					node.attrs?.objects ?? [],
					node.attrs?.scale,
					node.attrs?.float,
				),
			};
			state.write(formatter.openTag(formatter.type === Syntax.github ? "img" : "image", attrs, true));
		} else {
			state.write(
				"![" +
					state.esc(node.attrs.alt || "") +
					"](" +
					(node.attrs.src?.includes?.(" ") ? `<${node.attrs.src}>` : node.attrs.src) +
					(node.attrs.title ? ' "' + node.attrs.title.replace(/"/g, '\\"') + '"' : "") +
					")" +
					(hasSize ? `{width=${node.attrs.width} height=${node.attrs.height}}` : ""),
			);
		}
		state.closeBlock(node);
	};

export default imageNodeFormatter;
