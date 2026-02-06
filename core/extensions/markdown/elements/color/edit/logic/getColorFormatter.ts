import { getFormatterTypeByContext } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { MarkSerializerSpec } from "../../../../core/edit/logic/Prosemirror/to_markdown";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";

const getColorFormatter = (context?: ParserContext): MarkSerializerSpec => {
	const formatter = getFormatterTypeByContext(context);
	return {
		open(_, mark) {
			const color = mark.attrs.color;
			if (!color) return "";
			return formatter.openTag("color", mark.attrs);
		},
		close(_, mark) {
			const color = mark.attrs.color;
			if (!color) return "";
			return formatter.closeTag("color");
		},
		mixable: true,
		expelEnclosingWhitespace: true,
	};
};

export default getColorFormatter;
