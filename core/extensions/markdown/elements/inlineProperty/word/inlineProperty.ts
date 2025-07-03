import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import getTextByProperty from "@ext/markdown/elements/inlineProperty/edit/logic/getTextByProperty";

export const inlinePropertyWordLayout: WordInlineChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	if (!attrs?.bind) return [];

	const article = wordRenderContext.parserContext.getArticle();
	const catalog = wordRenderContext.catalog;
	const template = catalog.customProviders.templateProvider.getArticle(article.props.template);
	if (!template) return [];

	const properties = article.props?.properties;

	const catalogProperties =
		template.props?.customProperties?.length > 0 ? template.props.customProperties : catalog.props.properties;
	const catalogProperty = catalogProperties.find((p) => p.name === attrs.bind);

	if (!catalogProperty) return [];
	const articleProperty = properties?.find((p) => p.name === attrs.bind);
	const displayValue = getTextByProperty({ ...catalogProperty, value: articleProperty?.value }, !!articleProperty);

	return state.renderInline(new Tag("p", {}, [displayValue]), { ...(addOptions ?? {}) });
};
