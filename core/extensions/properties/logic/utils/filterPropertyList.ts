import { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/logic/handlePasteMarkdown";
import { shouldPropertyVisible } from "@ext/properties/logic/shouldPropertyVisible";
import type { Property } from "@ext/properties/models";
import { isComplexProperty } from "@ext/templates/models/properties";

export const filterPropertyList = (property: Property, isReadOnly: boolean = false) => {
	return (
		!isComplexProperty[property.type] &&
		!isMarkdownText(property.value?.[0]) &&
		shouldPropertyVisible(property, isReadOnly)
	);
};
