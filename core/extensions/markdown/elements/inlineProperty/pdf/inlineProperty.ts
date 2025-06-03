import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import getTextByProperty from "@ext/markdown/elements/inlineProperty/edit/logic/getTextByProperty";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { ContentText } from "pdfmake/interfaces";

export const inlinePropertyHandler = (tag: Tag, context: pdfRenderContext): ContentText[] => {
	if (!tag.attributes?.bind) return [];

	const article = context.parserContext.getArticle();
	const catalog = context.catalog;
	const template = catalog.customProviders.templateProvider.getArticle(article.props.template);
	if (!template) return [];

	const properties = article.props?.properties;

	const catalogProperty = template.props.customProperties.find((p) => p.name === tag.attributes.bind);

	if (!catalogProperty) return [];

	const articleProperty = properties?.find((p) => p.name === tag.attributes.bind);
	const displayValue = getTextByProperty({ ...catalogProperty, value: articleProperty?.value }, !!articleProperty);
	return [{ text: displayValue }];
};
