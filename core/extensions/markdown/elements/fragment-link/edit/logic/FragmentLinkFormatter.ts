import { getFormatterTypeByContext } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import type { MarkSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";

const getFragmentLinkFormatter = (context?: ParserContext): MarkSerializerSpec => {
	const formatter = getFormatterTypeByContext(context);
	return {
		open(_, mark) {
			const id = mark.attrs.id;
			if (!id) return "";
			return formatter.openTag("fragment-link", { id });
		},
		close(_, mark) {
			const id = mark.attrs.id;
			if (!id) return "";
			return formatter.closeTag("fragment-link");
		},
		mixable: true,
		expelEnclosingWhitespace: true,
	};
};

export default getFragmentLinkFormatter;
