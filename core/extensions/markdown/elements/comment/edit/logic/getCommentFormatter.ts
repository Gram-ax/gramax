import { getFormatterTypeByContext } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { MarkSerializerSpec } from "../../../../core/edit/logic/Prosemirror/to_markdown";

const getCommentFormatter = (context?: ParserContext): MarkSerializerSpec => {
	if (!context) return { open: () => "", close: () => "" };
	const formatter = getFormatterTypeByContext(context);

	return {
		open: (_state, mark) => {
			if (!mark.attrs?.id) return "";
			return formatter.openTag("comment", { id: mark.attrs.id });
		},
		close(_, mark) {
			if (!mark.attrs?.id) return "";
			return formatter.closeTag("comment");
		},
		mixable: true,
	};
};

export default getCommentFormatter;
