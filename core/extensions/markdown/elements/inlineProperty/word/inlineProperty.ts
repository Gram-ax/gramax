import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import getTextByProperty from "@ext/markdown/elements/inlineProperty/edit/logic/getTextByProperty";
import { resolveExportScopeProperty } from "@ext/markdown/elements/inlineProperty/edit/logic/resolveExportProperty";
import type { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const inlinePropertyWordLayout: WordInlineChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	if (!attrs?.bind) return [];

	const article = wordRenderContext.parserContext.getArticle();
	const catalog = wordRenderContext.catalog;
	const template = catalog.customProviders.templateProvider.getArticle(article.props.template);
	const catalogProperties =
		template?.props?.customProperties?.length > 0 ? template.props.customProperties : catalog.props.properties;

	const resolved = resolveExportScopeProperty(catalog, catalogProperties, article.props?.properties, attrs.bind);
	if (!resolved) return [];

	const displayValue = getTextByProperty(resolved.property, resolved.exists);

	return state.renderInline(new Tag("p", {}, [displayValue]), { ...(addOptions ?? {}) });
};
