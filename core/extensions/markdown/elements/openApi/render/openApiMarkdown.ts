import { renderMarkdownItHtml, renderMarkdownItInlineHtml } from "@ext/markdown/core/render/logic/Markdoc";
import type { MarkdownRenderer } from "@gramax/openapi-viewer";

/**
 * Descriptions inside an OpenAPI block are Markdown, and Gramax already has a renderer for Markdown — this
 * hands the viewer that one instead of letting it carry a second, weaker parser. The same source text then
 * reads the same way whether it sits in an article or in a spec's `description`.
 *
 * Headings rendered here are plain markup and nothing else: the article's table of contents is built from the
 * parsed article tree, and an API block's own navigation from the spec's tags and operations. Neither reads
 * the DOM, so a `#` inside a description stays a heading in a paragraph and never becomes a TOC entry.
 */
const renderOpenApiMarkdown: MarkdownRenderer = (markdown, { inline }) =>
	inline ? renderMarkdownItInlineHtml(markdown) : renderMarkdownItHtml(markdown);

export default renderOpenApiMarkdown;
