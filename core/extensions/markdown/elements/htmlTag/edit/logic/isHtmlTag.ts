const INLINE_HTML_TAGS = ["inlineHtmlTag", "selfClosingHtmlTag"];
const BLOCK_HTML_TAGS = ["blockHtmlTag", "blockWithInlineHtmlTag"];

export const isInlineHtmlTag = (type: string): boolean => INLINE_HTML_TAGS.includes(type);
export const isBlockHtmlTag = (type: string): boolean => BLOCK_HTML_TAGS.includes(type);
