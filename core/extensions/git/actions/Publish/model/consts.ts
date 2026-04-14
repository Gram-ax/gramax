import DiagramType from "@core/components/Diagram/DiagramType";

export const IMG_FILE_TYPES = ["png", "jpg", "jpeg", "bmp", "svg", "gif", "webp", "avif", "tiff", "heif", "ico"];
export const DIAGRAM_FILE_TYPES = {
	mermaid: DiagramType.mermaid,
	puml: DiagramType["plant-uml"],
};

export const DOCUMENT_SIZE_LIMIT_BYTES = 1024 * 1024; // 1MB

export const KNOWN_TEXT_EXTENSIONS = [
	"md",
	"markdown",
	"txt",
	"json",
	"js",
	"ts",
	"tsx",
	"jsx",
	"css",
	"scss",
	"less",
	"html",
	"htm",
	"xml",
	"yaml",
	"yml",
	"env",
	"ini",
	"cfg",
	"conf",
	"log",
	"csv",
	"sql",
	"sh",
	"bash",
	"py",
	"rb",
	"go",
	"rs",
	"java",
	"kt",
	"swift",
	"c",
	"cpp",
	"h",
	"hpp",
];
