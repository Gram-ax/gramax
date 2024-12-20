function contentTypeToExtension(contentType: string): string {
	const mimeTypes: { [key: string]: string } = {
		// Images
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/svg+xml": "svg",
		"image/bmp": "bmp",
		"image/tiff": "tiff",
		"image/vnd.microsoft.icon": "ico",

		// Audio
		"audio/mpeg": "mp3",
		"audio/wav": "wav",
		"audio/ogg": "ogg",
		"audio/mp4": "m4a",
		"audio/aac": "aac",
		"audio/flac": "flac",
		"audio/x-ms-wma": "wma",

		// Video
		"video/mp4": "mp4",
		"video/webm": "webm",
		"video/ogg": "ogv",
		"video/x-msvideo": "avi",
		"video/quicktime": "mov",
		"video/mpeg": "mpeg",

		// Text
		"text/plain": "txt",
		"text/html": "html",
		"text/css": "css",
		"text/javascript": "js",
		"text/csv": "csv",
		"text/markdown": "md",
		"text/xml": "xml",

		// Application
		"application/json": "json",
		"application/pdf": "pdf",
		"application/zip": "zip",
		"application/x-rar-compressed": "rar",
		"application/x-7z-compressed": "7z",
		"application/vnd.ms-excel": "xls",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
		"application/msword": "doc",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
		"application/vnd.ms-powerpoint": "ppt",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
		"application/octet-stream": "bin",
		"application/x-tar": "tar",
		"application/x-iso9660-image": "iso",
	};

	return mimeTypes[contentType] || "bin";
}

export default contentTypeToExtension;
