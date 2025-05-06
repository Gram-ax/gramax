import { MarkSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import getCodeFormatter from "@ext/markdown/elements/code/edit/logic/getCodeFormatter";
import getColorFormatter from "@ext/markdown/elements/color/edit/logic/getColorFormatter";
import getCommentFormatter from "@ext/markdown/elements/comment/edit/logic/getCommentFormatter";
import getEmFormatter from "@ext/markdown/elements/em/edit/logic/getEmFormatter";
import getLinkFormatter from "@ext/markdown/elements/link/edit/logic/getLinkFormatter";
import getInlineMdFormatter from "@ext/markdown/elements/md/logic/getInlineMdFormatter";
import getStrikeFormatter from "@ext/markdown/elements/strikethrough/edit/logic/getStrikeFormatter";
import getStrongFormatter from "@ext/markdown/elements/strong/edit/logic/getStrongFormatter";
import getSuggestionFormatter from "@ext/StyleGuide/extension/getSuggestionFormatter";

const getMarkFormatters = (context?: ParserContext): { [mark: string]: MarkSerializerSpec } => ({
	em: getEmFormatter(),
	s: getStrikeFormatter(),
	link: getLinkFormatter(),
	code: getCodeFormatter(),
	color: getColorFormatter(context),
	strong: getStrongFormatter(),
	inlineMd: getInlineMdFormatter(),
	suggestion: getSuggestionFormatter(),
	comment: getCommentFormatter(context),
});

export default getMarkFormatters;
