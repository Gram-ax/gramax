import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import getTextByProperty from "@ext/markdown/elements/inlineProperty/edit/logic/getTextByProperty";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { Content } from "pdfmake/interfaces";
import { JSONContent } from "@tiptap/core";
import { paragraphCase } from "@ext/markdown/elements/paragraph/pdf/paragraph";

export const inlinePropertyHandler = async (tag: Tag | JSONContent, context: pdfRenderContext): Promise<Content[]> => {
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	if (!attrs?.bind) return [];

	const article = context.parserContext.getArticle();
	const catalog = context.catalog;
	const template = catalog.customProviders.templateProvider.getArticle(article.props.template);
	if (!template) return [];

	const properties = article.props?.properties;

	const catalogProperties =
		template.props?.customProperties?.length > 0 ? template.props.customProperties : catalog.props.properties;
	const catalogProperty = catalogProperties.find((p) => p.name === attrs.bind);

	if (!catalogProperty) return [];

	const articleProperty = properties?.find((p) => p.name === attrs.bind);
	const displayValue = getTextByProperty({ ...catalogProperty, value: articleProperty?.value }, !!articleProperty);

	const content = await paragraphCase(new Tag("p", {}, [displayValue]), context);
	return content;
};
