import { getFormatterTypeByContext } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { MarkSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";

const getHighlightFormatter = (context?: ParserContext): MarkSerializerSpec => {
	const formatter = getFormatterTypeByContext(context);
	return {
		open(_, mark) {
			const color = mark.attrs.color;
			if (!color) return "";
			return formatter.openTag("highlight", mark.attrs);
		},
		close(_, mark) {
			const color = mark.attrs.color;
			if (!color) return "";
			return formatter.closeTag("highlight");
		},
		mixable: true,
		expelEnclosingWhitespace: true,
	};
};

export default getHighlightFormatter;
