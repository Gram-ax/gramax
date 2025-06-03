const inlineElements = [
	"b",
	"i",
	"strong",
	"em",
	"a",
	"code",
	"tt",
	"ins",
	"del",
	"sup",
	"sub",
	"kbd",
	"q",
	"samp",
	"var",
	"ruby",
	"rt",
	"rp",
	"s",
	"strike",
	"abbr",
	"bdo",
	"cite",
	"dfn",
	"mark",
	"small",
	"span",
	"time",
];

const blockElements = [
	"p",
	"div",
	// "pre",
	"picture",
	"ol",
	"ul",
	"table",
	"thead",
	"tbody",
	"tfoot",
	"blockquote",
	"dl",
	"dt",
	"dd",
	"li",
	"tr",
	"td",
	"th",
	"summary",
	"details",
	"caption",
	"figure",
	"figcaption",
];

const blockWithInlineElements = ["h1", "h2", "h3", "h4", "h5", "h6", "dt", "dd", "caption", "th", "td"];

const selfClosingTags = ["br", "img", "hr", "source", "wbr"];

const allowedElements = {
	inline: inlineElements,
	block: blockElements,
	blockWithInline: blockWithInlineElements,
	selfClosing: selfClosingTags,
};

const isSelfClosingTag = (name: string) => selfClosingTags.includes(name.toLowerCase());

const specificElementAttributes = {
	a: ["href"],
	img: ["src", "longdesc", "loading", "alt"],
	div: ["itemscope", "itemtype"],
	blockquote: ["cite"],
	del: ["cite"],
	ins: ["cite"],
	q: ["cite"],
	source: ["srcset"],
};

const globalAttributes = [
	"abbr",
	"accept",
	"accept-charset",
	"accesskey",
	"action",
	"align",
	"alt",
	"aria-describedby",
	"aria-hidden",
	"aria-label",
	"aria-labelledby",
	"axis",
	"border",
	"char",
	"charoff",
	"charset",
	"checked",
	"clear",
	"cols",
	"colspan",
	"compact",
	"coords",
	"datetime",
	"dir",
	"disabled",
	"enctype",
	"for",
	"frame",
	"headers",
	"height",
	"hreflang",
	"hspace",
	"id",
	"ismap",
	"label",
	"lang",
	"maxlength",
	"media",
	"method",
	"multiple",
	"name",
	"nohref",
	"noshade",
	"nowrap",
	"open",
	"progress",
	"prompt",
	"readonly",
	"rel",
	"rev",
	"role",
	"rows",
	"rowspan",
	"rules",
	"scope",
	"selected",
	"shape",
	"size",
	"span",
	"start",
	"summary",
	"tabindex",
	"title",
	"type",
	"usemap",
	"valign",
	"value",
	"width",
	"itemprop",
];

const isAllowedElement = (name: string) =>
	allowedElements.inline.includes(name.toLowerCase()) ||
	allowedElements.block.includes(name.toLowerCase()) ||
	allowedElements.blockWithInline.includes(name.toLowerCase()) ||
	allowedElements.selfClosing.includes(name.toLowerCase());

const isAllowedAttribute = (name: string, attr: string) => {
	if (globalAttributes.includes(attr)) {
		return true;
	}

	const elementSpecificAttrs = specificElementAttributes[name.toLowerCase()];
	if (elementSpecificAttrs && elementSpecificAttrs.includes(attr)) {
		return true;
	}
	return false;
};

const filterHtmlAttributes = (tagName: string, htmlAttrs: Record<string, any>) => {
	const filteredAttrs: Record<string, any> = {};

	Object.keys(htmlAttrs).forEach((attr) => {
		if (isAllowedAttribute(tagName, attr)) {
			filteredAttrs[attr] = htmlAttrs[attr];
		}
	});

	return filteredAttrs;
};

export {
	allowedElements,
	inlineElements,
	blockElements,
	blockWithInlineElements,
	selfClosingTags,
	isAllowedElement,
	filterHtmlAttributes,
	isSelfClosingTag,
};
