export const COMMENT_INLINE_NODE_TYPES = ["inlineMd_component", "icon", "inlineImage"];
export const COMMENT_BLOCK_NODE_TYPES = [
	"image",
	"diagrams",
	"drawio",
	"video",
	"openapi",
	"snippet",
	"html",
	"view",
	"mermaid",
	"plant-uml",
	"ts-diagram",
	"c4-diagram",
];

export const COMMENT_NODE_TYPES = [...COMMENT_BLOCK_NODE_TYPES, ...COMMENT_INLINE_NODE_TYPES];
