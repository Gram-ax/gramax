import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import XmlFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import noteFormatter from "@ext/markdown/elements/note/edit/logic/github/noteFormatter";

const GitHubFormatter: FormatterType = {
	nodeFormatters: {
		...XmlFormatter.nodeFormatters,
		note: noteFormatter,
	},
	openTag: XmlFormatter.openTag,
	closeTag: XmlFormatter.closeTag,
	type: Syntax.github,
	supportedElements: [],
};

export default GitHubFormatter;
