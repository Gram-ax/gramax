export const DEFAULT_LFS_PATTERNS = [
	"*.jpg",
	"*.jpeg",
	"*.png",
	"*.webp",
	"*.gif",

	"*.mp4",
	"*.wmv",
	"*.avi",
	"*.mov",
	"*.mkv",
	"*.webm",
	"*.mpg",
	"*.mpeg",

	"*.pdf",
	"*.doc",
	"*.docx",
	"*.xls",
	"*.xlsx",
	"*.ppt",
	"*.pptx",

	"*.zip",
	"*.rar",
	"*.7z",
	"*.tar",
	"*.gz",
	"*.bz2",
];

export type LfsOptions = {
	patterns: string[];
	lazy: boolean;
};
