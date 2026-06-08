import type { GlobalFormatter } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import propertyFormatter from "@ext/properties/logic/utils/PropertyFormatter";
import { getFormatterTypeByContext } from "./typeFormats/getFormatterType";

const getGlobalFormatters = (context: ParserContext): GlobalFormatter[] => {
	const formatter = getFormatterTypeByContext(context);
	return [propertyFormatter(formatter)];
};

export default getGlobalFormatters;
