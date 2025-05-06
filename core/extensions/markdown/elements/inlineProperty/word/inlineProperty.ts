import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import getTextByProperty from "@ext/markdown/elements/inlineProperty/edit/logic/getTextByProperty";

export const inlinePropertyWordLayout: WordInlineChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	if (!tag.attributes?.bind) return [];

	const article = wordRenderContext.parserContext.getArticle();
	const catalog = wordRenderContext.catalog;
	const properties = article.props?.properties;

	const catalogProperty = catalog.props.properties.find((p) => p.name === tag.attributes.bind);

	if (!catalogProperty) return [];
	const articleProperty = properties?.find((p) => p.name === tag.attributes.bind);
	const displayValue = getTextByProperty({ ...catalogProperty, value: articleProperty?.value }, !!articleProperty);

	const newTag = new Tag("Inline-property", { ...tag.attributes, ...addOptions }, [displayValue]);
	return state.renderInline(newTag, { ...(addOptions ?? {}) });
};
