import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import getTextByProperty from "@ext/markdown/elements/inlineProperty/edit/logic/getTextByProperty";

export const inlinePropertyWordLayout: WordInlineChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	if (!tag.attributes?.bind) return [];

	const article = wordRenderContext.parserContext.getArticle();
	const catalog = wordRenderContext.catalog;
	const template = catalog.customProviders.templateProvider.getArticle(article.props.template);
	if (!template) return [];

	const properties = article.props?.properties;

	const catalogProperty = template.props.customProperties.find((p) => p.name === tag.attributes.bind);

	if (!catalogProperty) return [];
	const articleProperty = properties?.find((p) => p.name === tag.attributes.bind);
	const displayValue = getTextByProperty({ ...catalogProperty, value: articleProperty?.value }, !!articleProperty);

	const newTag = new Tag("Inline-property", { ...tag.attributes, ...addOptions }, [displayValue]);
	return state.renderInline(newTag, { ...(addOptions ?? {}) });
};
